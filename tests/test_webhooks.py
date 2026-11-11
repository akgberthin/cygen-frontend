"""Lead webhook contract: exact signature test vector, retry classification,
compact serialization, not-configured no-op. Run: pytest tests/test_webhooks.py"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

import webhooks  # noqa: E402


def test_signature_test_vector():
    body = '{"event":"enquiry.created","id":"evt_0001","created_at":"2026-10-30T14:00:00Z","language":"en","path":"purchase","data":{"name":"Test Person","email":"test.person@example.org","message":"I would like to know more.","consent":true}}'
    got = webhooks.sign("whsec_test_0123456789abcdef", 1793300000, body)
    assert got == "sha256=94ee338fe23bd3d7e054bfd9ea6cd02523aa20951553b30d228ef046df1b7c74"


def test_compact_serialization():
    raw = webhooks.compact_json({"a": 1, "b": "x y"})
    assert raw == '{"a":1,"b":"x y"}'


def test_build_body_shape():
    raw = webhooks.build_body(
        "scenario.started", "scn_x", "en", "purchase",
        {"site": "https://cygenequities.com", "page": "/en", "referrer": "", "campaign": ""},
        {"scenario_id": "scn_x", "figures": {"home_value": 300000}, "session": "s1"},
    )
    import json
    body = json.loads(raw)
    assert body["event"] == "scenario.started"
    assert body["id"] == "scn_x"
    assert body["path"] == "purchase"
    assert body["source"] == {"site": "https://cygenequities.com", "page": "/en"}  # empties dropped
    assert body["data"]["figures"]["home_value"] == 300000
    assert ", " not in raw and '": ' not in raw  # compact


def test_body_size_limit():
    with pytest.raises(ValueError):
        webhooks.build_body("enquiry.created", "x", "en", None, {}, {"message": "z" * 40000})


@pytest.mark.parametrize("status,expected", [
    (401, "refused"), (403, "refused"), (413, "refused"), (422, "refused"),
    (429, "retry"), (500, "retry"), (503, "retry"),
])
def test_retry_classification(status, expected):
    outcome, _ = webhooks._classify_failure(status, "x")
    assert outcome == expected


def test_not_configured_noop(monkeypatch):
    monkeypatch.delenv("LEAD_WEBHOOK_URL", raising=False)
    assert webhooks.configured() is False

    class FakeDB:
        async def insert_one(self, doc):
            raise AssertionError("nothing may be stored or sent when not configured")

        def __getattr__(self, name):
            return self

    import asyncio
    assert asyncio.run(webhooks.enqueue(FakeDB().webhook_deliveries and FakeDB(), "enquiry.created", "x", "en", None, {}, {})) is None
