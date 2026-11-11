"""Outbound lead webhook delivery, matched exactly to the CYGEN intake contract.

POST {LEAD_WEBHOOK_URL} with:
  Content-Type: application/json
  X-Cygen-Timestamp: unix seconds at the moment of signing (integer as text)
  X-Cygen-Signature: "sha256=" + HMAC-SHA256(secret, "<timestamp>.<raw body>")
  X-Cygen-Delivery: the delivery id (same as body "id", reused on every retry)

Body: compact JSON (no spaces) {"event","id","created_at","language","path",
"source":{"site","page","referrer"?,"campaign"?},"data":{...}}.

Retry only 429, 5xx and network errors (backoff 1, 5, 30 minutes), same
delivery id, FRESH timestamp and signature per attempt. 401/403/413/422 are
never retried. Nothing is sent when LEAD_WEBHOOK_URL is empty.
"""
import asyncio
import hashlib
import hmac
import json
import logging
import os
import time
from datetime import datetime, timezone

import requests

logger = logging.getLogger(__name__)

BACKOFF_SECONDS = [60, 300, 1800]
MAX_ATTEMPTS = 1 + len(BACKOFF_SECONDS)
NO_RETRY_STATUSES = {401, 403, 413, 422}
MAX_BODY_BYTES = 32 * 1024


def webhook_url():
    return (os.environ.get("LEAD_WEBHOOK_URL") or "").strip()


def webhook_secret():
    return (os.environ.get("LEAD_WEBHOOK_SECRET") or "").strip()


def configured():
    return bool(webhook_url())


def sign(secret, timestamp, raw_body):
    """HMAC-SHA256 over the text '<timestamp>.<raw body>' -> 'sha256=<hex>'."""
    if isinstance(raw_body, str):
        raw_body = raw_body.encode("utf-8")
    msg = str(timestamp).encode("utf-8") + b"." + raw_body
    return "sha256=" + hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()


def compact_json(obj):
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=False)


def build_body(event, delivery_id, language, path, source, data):
    body = {
        "event": event,
        "id": delivery_id,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "language": language if language in ("en", "es") else "en",
        "path": path if path in ("purchase", "refinance") else None,
        "source": {k: v for k, v in (source or {}).items() if v},
        "data": data,
    }
    raw = compact_json(body)
    if len(raw.encode("utf-8")) > MAX_BODY_BYTES:
        raise ValueError("body_too_large")
    return raw


def _classify_failure(status_code, reason):
    if status_code in NO_RETRY_STATUSES:
        return "refused", None
    if status_code == 429 or status_code >= 500:
        return "retry", reason
    return "refused", reason  # unknown 4xx: do not retry


async def _record_attempt(db, delivery_id, outcome, error, next_attempt_at):
    await db.webhook_deliveries.update_one(
        {"id": delivery_id},
        {
            "$set": {
                "status": outcome,
                "last_error": error,
                "next_attempt_at": next_attempt_at,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            "$inc": {"attempts": 1},
        },
    )


def _post_sync(url, raw, secret):
    ts = str(int(time.time()))
    headers = {
        "Content-Type": "application/json",
        "X-Cygen-Timestamp": ts,
        "X-Cygen-Signature": sign(secret, ts, raw),
        "X-Cygen-Delivery": json.loads(raw)["id"],
    }
    return requests.post(url, data=raw.encode("utf-8"), headers=headers, timeout=10)


async def attempt_delivery(db, delivery_id):
    doc = await db.webhook_deliveries.find_one({"id": delivery_id})
    if not doc or doc.get("status") == "delivered":
        return
    url = webhook_url()
    if not url:
        await db.webhook_deliveries.update_one({"id": delivery_id}, {"$set": {"status": "not_configured"}})
        return
    raw = doc["body"]
    secret = webhook_secret()
    try:
        resp = await asyncio.to_thread(_post_sync, url, raw, secret)
        status = resp.status_code
        reason = ""
        try:
            reason = resp.json().get("status") or resp.json().get("error") or ""
        except Exception:
            reason = resp.text[:200]
    except Exception as exc:  # network error -> retry
        status, reason = None, f"network: {exc.__class__.__name__}"

    now = time.time()
    if status == 200:
        await _record_attempt(db, delivery_id, "delivered", None, None)
        return
    if status is None:
        outcome, err = "retry", reason
    else:
        outcome, err = _classify_failure(status, reason or f"http_{status}")

    attempts = doc.get("attempts", 0) + 1
    if outcome == "retry" and attempts < MAX_ATTEMPTS:
        next_at = datetime.fromtimestamp(now + BACKOFF_SECONDS[min(attempts - 1, len(BACKOFF_SECONDS) - 1)], timezone.utc).isoformat()
        await _record_attempt(db, delivery_id, "pending", err, next_at)
    elif outcome == "retry":
        await _record_attempt(db, delivery_id, "failed", err, None)
    else:
        await _record_attempt(db, delivery_id, "refused", err, None)


async def enqueue(db, event, delivery_id, language, path, source, data):
    """Store + fire a delivery in the background. No-op when not configured."""
    if not configured():
        return None
    raw = build_body(event, delivery_id, language, path, source, data)
    doc = {
        "id": delivery_id,
        "event": event,
        "body": raw,
        "language": language if language in ("en", "es") else "en",
        "path": path if path in ("purchase", "refinance") else None,
        "status": "pending",
        "attempts": 0,
        "last_error": None,
        "next_attempt_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.webhook_deliveries.insert_one(doc)
    try:
        asyncio.get_running_loop().create_task(attempt_delivery(db, delivery_id))
    except RuntimeError:
        pass
    return delivery_id


async def sweep_due(db, limit=25):
    """Retry every pending delivery whose backoff has elapsed. Returns count."""
    now = datetime.now(timezone.utc).isoformat()
    due = await db.webhook_deliveries.find(
        {"status": "pending", "next_attempt_at": {"$lte": now}}, {"_id": 0, "id": 1}
    ).to_list(limit)
    for d in due:
        await attempt_delivery(db, d["id"])
    return len(due)
