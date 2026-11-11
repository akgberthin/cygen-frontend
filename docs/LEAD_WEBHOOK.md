# Lead alerts webhook (outbound)

CYGEN forwards contact events to the partner intake API in real time, in the background (visitors are never slowed).

## Configuration

Set these backend environment variables (leave empty to disable; Admin shows "webhook not configured"):

- `LEAD_WEBHOOK_URL` — the full intake address: `{CYGEN API base}/v1/integrations/website/leads` (the owner sets the base; leave empty until then)
- `LEAD_WEBHOOK_SECRET` — shared HMAC secret from CYGEN

Related (already set): `JWT_SECRET` (visitor account tokens), `WEBHOOK_CRON_SECRET` (bearer token for the retry sweep and the scenario-retention purge, called every 15 minutes and daily by the cron container, see `deploy/cron.sh`).

## Request

`POST {LEAD_WEBHOOK_URL}` with headers:

- `Content-Type: application/json`
- `X-Cygen-Timestamp` — Unix seconds at the moment of signing (integer as text)
- `X-Cygen-Signature` — `sha256=` + lowercase hex of HMAC-SHA256 keyed by `LEAD_WEBHOOK_SECRET` over the text `<timestamp>.<raw body>` (timestamp, a dot, then the exact bytes sent; sign the same string you transmit, no re-serialising)
- `X-Cygen-Delivery` — the delivery id (same as the body `id`; reused on every retry so retries are safe)

Body is compact JSON (no spaces after separators):

```json
{"event":"enquiry.created","id":"evt_9f1c","created_at":"2026-10-30T14:00:00Z","language":"en","path":"purchase","source":{"site":"https://cygenequities.com","page":"/en/contact"},"data":{"name":"...","email":"...","message":"...","consent":true,"preferred_channel":"email"}}
```

Events:

- `enquiry.created` (contact form): `name` (required), `email` or `phone` (one required), `message`, `consent` (required), `preferred_channel` ("email"|"sms"|"phone")
- `application.created`: `name`, `email` or `phone`, `consent`, `application_ref`, `answers` (short labels: goal, home, home_value, initial_share, existing_financing — never a government id, account number or password), `scenario_id`
- `scenario.started`: `scenario_id` (required), `figures` (numbers or numeric strings only: home_value, amount, cop, equity_payment, path…), `session` (random id, no personal data). `name`, `email`/`phone` and `consent` are included only if the visitor already gave them. A scenario with no contact is sent too — it is counted, nobody is contacted.

Consent false means the contact record is never sent (the receiver refuses it and stores nothing).

## Receiver responses and retries

- 200 `{"id","status":"received","duplicate":bool}` — success or a repeat
- 401 `bad_signature` / `stale_timestamp`, 403 `consent_required`, 413 `body_too_large` (32 KiB limit), 422 `invalid_body` / `invalid_event` / `contact_required` — never retried (fix the clock or secret)
- 429 `rate_limited`, 5xx (`intake_not_configured`, `intake_paused`), network errors — retried after 1, 5 and 30 minutes, same delivery id, fresh timestamp and signature each attempt (the receiver rejects timestamps older than 300 seconds)

Every attempt is logged (Admin → Lead alerts: status, attempts, last error, Resend button). The retry sweep runs via the platform cron `webhook-sweep` every 15 minutes; the scenario retention purge runs daily via `purge-scenarios` (default 180 days, adjustable in Admin → Scenario retention).

## Verify a signature (Python)

```python
import hashlib, hmac

def verify(secret: str, timestamp: str, raw_body: bytes, header: str) -> bool:
    expected = "sha256=" + hmac.new(secret.encode(), timestamp.encode() + b"." + raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header)
```

Check the timestamp is within 300 seconds before accepting.

Test vector (asserted in `tests/test_webhooks.py`): secret `whsec_test_0123456789abcdef`, timestamp `1793300000`, body exactly `{"event":"enquiry.created","id":"evt_0001","created_at":"2026-10-30T14:00:00Z","language":"en","path":"purchase","data":{"name":"Test Person","email":"test.person@example.org","message":"I would like to know more.","consent":true}}` → `X-Cygen-Signature: sha256=94ee338fe23bd3d7e054bfd9ea6cd02523aa20951553b30d228ef046df1b7c74`.
