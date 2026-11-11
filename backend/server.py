import asyncio
import csv
import io
import json
import logging
import os
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Literal, Optional

import bcrypt
import jwt
from bson import ObjectId
from dotenv import load_dotenv
from anthropic import AsyncAnthropic
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from starlette.middleware.cors import CORSMiddleware

import concierge_config
import webhooks

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
JWT_SECRET = os.environ.get("JWT_SECRET", "")
CRON_SECRET = os.environ.get("WEBHOOK_CRON_SECRET", "")
SITE_URL = os.environ.get("SITE_URL", "https://cygenequities.com")
CONCIERGE_MODEL = os.environ.get("CONCIERGE_MODEL", "claude-sonnet-5-5")
JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="CYGEN Equities API")
api_router = APIRouter(prefix="/api")


# --- Consistent error bodies: {"error": {"code", "message"}} ---
class ApiError(HTTPException):
    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(status_code=status_code)
        self.code = code
        self.message = message


def api_error(status_code: int, code: str, message: str) -> ApiError:
    return ApiError(status_code, code, message)


@app.exception_handler(ApiError)
async def api_error_handler(_request: Request, exc: ApiError):
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": exc.code, "message": exc.message}})


@app.exception_handler(HTTPException)
async def http_error_handler(_request: Request, exc: HTTPException):
    code = exc.detail if isinstance(exc.detail, str) and exc.detail.replace("_", "").isalnum() else f"http_{exc.status_code}"
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(status_code=exc.status_code, content={"error": {"code": code, "message": message}})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError):
    code = "validation_error"
    message = "Invalid request"
    errors = exc.errors()
    if errors:
        raw = str(errors[0].get("msg", ""))
        cleaned = raw.replace("Value error, ", "")
        if cleaned.replace("_", "").isalnum():
            code = cleaned
        message = f"{errors[0].get('loc', [''])[-1]}: {cleaned}"
    return JSONResponse(status_code=422, content={"error": {"code": code, "message": message}})


# --- Rate limiting (per process, per endpoint+IP) ---
RATE_WINDOW_SECONDS = 600
RATE_MAX_POSTS = 10
_hits: dict = defaultdict(deque)


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def rate_limit(bucket: str, ip: str, max_hits: int = RATE_MAX_POSTS) -> None:
    key = f"{bucket}:{ip}"
    now = time.monotonic()
    q = _hits[key]
    while q and now - q[0] >= RATE_WINDOW_SECONDS:
        q.popleft()
    if len(q) >= max_hits:
        raise api_error(429, "rate_limited", "Too many requests; please try again later.")
    q.append(now)


# --- Admin guard (single shared password from env) ---
async def admin_guard(x_admin_password: Optional[str] = Header(default=None, alias="X-Admin-Password")):
    if not ADMIN_PASSWORD:
        raise api_error(503, "admin_not_configured", "Admin not configured")
    if not x_admin_password or not secrets.compare_digest(x_admin_password, ADMIN_PASSWORD):
        raise api_error(401, "invalid_admin_password", "Invalid admin password")


# --- Visitor accounts (bcrypt + JWT; Bearer header or cookie) ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def public_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "phone": doc.get("phone"),
        "preferred_language": doc.get("preferred_language", "en"),
        "application_ref": doc.get("application_ref"),
        "created_at": doc.get("created_at"),
    }


async def current_user(request: Request) -> dict:
    token = None
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise api_error(401, "not_authenticated", "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise api_error(401, "invalid_token", "Invalid or expired token")
    try:
        doc = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        doc = None
    if not doc:
        raise api_error(401, "user_not_found", "User not found")
    return doc


# --- Events (sample schedule; titles/descriptions live in the frontend i18n files) ---
# type: workshop | webinar | seminar; mode: online | in-person (location set for in-person)
WORKSHOPS = [
    {"id": "brokers-intro", "type": "webinar", "date": "2026-12-09", "time": "17:30", "duration_minutes": 45, "mode": "online", "location": "", "capacity": 20},
    {"id": "equity-payment-basics", "type": "workshop", "date": "2026-12-17", "time": "18:00", "duration_minutes": 60, "mode": "online", "location": "", "capacity": 30},
    {"id": "partner-seminar-houston", "type": "seminar", "date": "2027-01-14", "time": "18:30", "duration_minutes": 90, "mode": "in-person", "location": "Houston, TX", "capacity": 60},
    {"id": "bring-your-home", "type": "workshop", "date": "2027-01-28", "time": "18:00", "duration_minutes": 60, "mode": "online", "location": "", "capacity": 30},
]


# --- Payloads ---
class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=40)
    preferred_language: Literal["en", "es"] = "en"
    path_interest: Literal["purchase", "refinance", "unsure"] = "unsure"
    message: str = Field(default="", max_length=2000)
    consent: bool
    website: str = ""  # honeypot: browsers leave this empty
    page: str = Field(default="", max_length=200)
    referrer: str = Field(default="", max_length=300)
    campaign: str = Field(default="", max_length=120)

    @model_validator(mode="after")
    def check_contact_and_consent(self):
        if not self.email and not (self.phone and self.phone.strip()):
            raise ValueError("email_or_phone_required")
        if not self.consent:
            raise ValueError("consent_required")
        return self


class RegistrationIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=40)
    preferred_language: Literal["en", "es"] = "en"
    website: str = ""  # honeypot


class ApplicationIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str = Field(min_length=5, max_length=40)
    address: str = Field(min_length=3, max_length=200)
    preferred_language: Literal["en", "es"] = "en"
    path: Literal["purchase", "refinance"]
    city: str = Field(default="", max_length=120)
    home_value: Optional[float] = Field(default=None, ge=0, le=100000000)
    existing_financing: Optional[float] = Field(default=None, ge=0, le=100000000)
    initial_share: Optional[float] = Field(default=None, ge=0, le=100)
    scenario_id: Optional[str] = Field(default=None, max_length=80)
    consent: bool
    website: str = ""  # honeypot

    @model_validator(mode="after")
    def check_application(self):
        if not self.consent:
            raise ValueError("consent_required")
        if self.path == "refinance" and self.existing_financing is None:
            raise ValueError("existing_financing_required")
        if self.path == "purchase" and self.initial_share is None:
            raise ValueError("initial_share_required")
        return self


class ScenarioIn(BaseModel):
    language: Literal["en", "es"] = "en"
    path: Optional[Literal["purchase", "refinance"]] = None
    page: str = Field(default="", max_length=200)
    referrer: str = Field(default="", max_length=300)
    campaign: str = Field(default="", max_length=120)
    session: Optional[str] = Field(default=None, max_length=80)
    figures: Dict[str, Any] = Field(default_factory=dict)
    # optional contact details (sent on the webhook only when consent is true)
    name: Optional[str] = Field(default=None, max_length=120)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=40)
    consent: bool = False

    @field_validator("figures")
    @classmethod
    def check_figures(cls, value):
        if len(value) > 40:
            raise ValueError("figures_too_large")
        for key, val in value.items():
            if not isinstance(key, str) or len(key) > 40:
                raise ValueError("figures_bad_key")
            if isinstance(val, str) and len(val) > 80:
                raise ValueError("figures_bad_value")
            if not isinstance(val, (str, int, float, bool)) and val is not None:
                raise ValueError("figures_bad_value")
        return value


class ConciergeMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ConciergeIn(BaseModel):
    messages: list[ConciergeMessage] = Field(min_length=1, max_length=24)
    lang: Literal["en", "es"] = "en"
    path: Optional[Literal["purchase", "refinance"]] = None
    step: int = Field(default=1, ge=1, le=3)
    scenario: Optional[Dict[str, Any]] = None

    @field_validator("scenario")
    @classmethod
    def check_scenario(cls, value):
        if value is None:
            return value
        if len(value) > 40:
            raise ValueError("scenario_too_large")
        for key, val in value.items():
            if not isinstance(key, str) or len(key) > 40:
                raise ValueError("scenario_bad_key")
            if isinstance(val, str) and len(val) > 120:
                raise ValueError("scenario_bad_value")
            if not isinstance(val, (str, int, float, bool)) and val is not None:
                raise ValueError("scenario_bad_value")
        return value


class RegisterIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    application_ref: Optional[str] = Field(default=None, max_length=80)
    preferred_language: Literal["en", "es"] = "en"


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class ProfileIn(BaseModel):
    phone: Optional[str] = Field(default=None, max_length=40)
    preferred_language: Optional[Literal["en", "es"]] = None


# --- Webhook event helpers (contract in backend/webhooks.py) ---
def _source(page: str = "", referrer: str = "", campaign: str = "") -> dict:
    return {"site": SITE_URL, "page": page, "referrer": referrer, "campaign": campaign}


async def _fire(event, delivery_id, language, path, source, data):
    try:
        await webhooks.enqueue(db, event, delivery_id, language, path, source, data)
    except Exception:
        logger.exception("webhook enqueue failed for %s", event)


def _csv_safe(value):
    s = "" if value is None else str(value)
    if s[:1] in ("=", "+", "-", "@"):
        s = "'" + s
    return s


def _csv_response(docs, fields, filename):
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(fields)
    for doc in docs:
        writer.writerow([_csv_safe(doc.get(f, "")) for f in fields])
    return StreamingResponse(
        iter([out.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# --- Public routes ---
@api_router.get("/")
async def root():
    return {"status": "ok", "service": "cygen-equities"}


@api_router.get("/workshops")
async def list_workshops():
    result = []
    for w in WORKSHOPS:
        taken = await db.workshop_registrations.count_documents({"workshop_id": w["id"]})
        result.append({**w, "spots_left": max(0, w["capacity"] - taken)})
    return {"workshops": result}


@api_router.post("/leads")
async def create_lead(payload: LeadIn, request: Request):
    rate_limit("leads", client_ip(request))
    if payload.website:
        return {"ok": True}  # honeypot filled: accept silently, store nothing
    doc = payload.model_dump(exclude={"website", "page", "referrer", "campaign"})
    doc["email"] = str(payload.email) if payload.email else None
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.leads.insert_one(doc)
    data = {
        "name": payload.name,
        "message": payload.message,
        "consent": payload.consent,
        "preferred_channel": "email" if payload.email else "phone",
    }
    if payload.email:
        data["email"] = str(payload.email)
    if payload.phone:
        data["phone"] = payload.phone
    # consent is required by validation, so the contact record may always be sent
    await _fire("enquiry.created", f"evt_{secrets.token_hex(8)}", payload.preferred_language,
                payload.path_interest if payload.path_interest != "unsure" else None,
                _source(payload.page, payload.referrer, payload.campaign), data)
    doc.pop("_id", None)
    return {"ok": True}


@api_router.post("/workshops/{workshop_id}/registrations")
async def create_registration(workshop_id: str, payload: RegistrationIn, request: Request):
    rate_limit("registrations", client_ip(request))
    if payload.website:
        return {"ok": True}
    workshop = next((w for w in WORKSHOPS if w["id"] == workshop_id), None)
    if not workshop:
        raise api_error(404, "workshop_not_found", "Workshop not found")
    taken = await db.workshop_registrations.count_documents({"workshop_id": workshop_id})
    if taken >= workshop["capacity"]:
        raise api_error(409, "workshop_full", "This workshop is full")
    doc = payload.model_dump(exclude={"website"})
    doc["email"] = str(payload.email)
    doc["workshop_id"] = workshop_id
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.workshop_registrations.insert_one(doc)
    doc.pop("_id", None)
    return {"ok": True}


@api_router.post("/applications")
async def create_application(payload: ApplicationIn, request: Request):
    rate_limit("applications", client_ip(request))
    if payload.website:
        return {"ok": True, "application_ref": None}
    doc = payload.model_dump(exclude={"website", "scenario_id"})
    doc["email"] = str(payload.email)
    doc["name"] = f"{payload.first_name.strip()} {payload.last_name.strip()}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.applications.insert_one(doc)
    application_ref = str(result.inserted_id)

    if payload.scenario_id:
        link = await db.scenarios.find_one_and_update(
            {"id": payload.scenario_id}, {"$set": {"application_id": application_ref}}
        )
        if link:
            doc["scenario_id"] = payload.scenario_id

    answers = {"goal": payload.path}
    if payload.city:
        answers["home"] = payload.city
    if payload.address:
        answers["address"] = payload.address
    if payload.home_value:
        answers["home_value"] = str(payload.home_value)
    if payload.existing_financing:
        answers["existing_financing"] = str(payload.existing_financing)
    if payload.initial_share is not None:
        answers["initial_share"] = str(payload.initial_share)
    data = {"name": doc["name"], "email": str(payload.email), "phone": payload.phone, "consent": payload.consent, "application_ref": application_ref, "answers": answers}
    if payload.scenario_id:
        data["scenario_id"] = payload.scenario_id
    await _fire("application.created", f"evt_{secrets.token_hex(8)}", payload.preferred_language,
                payload.path, _source(f"/{payload.preferred_language}/apply"), data)
    return {"ok": True, "application_ref": application_ref}


@api_router.post("/scenarios")
async def create_scenario(payload: ScenarioIn, request: Request):
    """Log a 'Start with these numbers' click. No IP, no personal data unless the
    visitor included contact details with consent."""
    rate_limit("scenarios", client_ip(request), max_hits=30)
    scenario_id = f"scn_{secrets.token_hex(8)}"
    session = payload.session or secrets.token_hex(8)
    doc = {
        "id": scenario_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "language": payload.language,
        "path": payload.path,
        "page": payload.page,
        "referrer": payload.referrer,
        "campaign": payload.campaign,
        "session": session,
        "figures": payload.figures,
        "application_id": None,
    }
    await db.scenarios.insert_one(doc)
    data = {"scenario_id": scenario_id, "figures": payload.figures, "session": session}
    if payload.consent and payload.name and (payload.email or payload.phone):
        data["name"] = payload.name
        if payload.email:
            data["email"] = str(payload.email)
        if payload.phone:
            data["phone"] = payload.phone
        data["consent"] = True
    # scenarios without contact details are sent too: counted, nobody contacted
    await _fire("scenario.started", scenario_id, payload.language, payload.path,
                _source(payload.page, payload.referrer, payload.campaign), data)
    return {"id": scenario_id, "session": session}


@api_router.post("/concierge")
async def concierge(payload: ConciergeIn, request: Request):
    rate_limit("concierge", client_ip(request), max_hits=30)
    last_user = next((m for m in reversed(payload.messages) if m.role == "user"), payload.messages[-1])
    route = concierge_config.classify(last_user.content)
    await db.concierge_turns.insert_one({
        "route": route,
        "lang": payload.lang,
        "prompt_version": concierge_config.PROMPT_VERSION,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    async def canned_events():
        yield f"data: {json.dumps({'route': route})}\n\n"
        yield f"data: {json.dumps({'delta': concierge_config.canned_reply(route, payload.lang)})}\n\n"
        yield "data: [DONE]\n\n"

    if route in concierge_config.CANNED_ROUTES:
        return StreamingResponse(
            canned_events(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise api_error(503, "concierge_not_configured", "Concierge not configured")
    system = concierge_config.system_prompt(payload.lang, payload.path, payload.step, payload.scenario)
    system += f"\n\nCurrent topic: {concierge_config.ROUTE_HINTS.get(route, concierge_config.ROUTE_HINTS['explain_paths'])}"
    transcript = "\n".join(f"{'Visitor' if m.role == 'user' else 'Concierge'}: {m.content}" for m in payload.messages[-12:])

    async def events():
        yield f"data: {json.dumps({'route': route})}\n\n"
        try:
            client = AsyncAnthropic(api_key=api_key)
            async with client.messages.stream(model=CONCIERGE_MODEL, max_tokens=600, system=system, messages=[{"role": "user", "content": transcript}]) as stream:
                async for text in stream.text_stream:
                    yield f"data: {json.dumps({'delta': text})}\n\n"
        except Exception:
            logger.exception("Concierge stream failed")
            yield f"data: {json.dumps({'error': True})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# --- Visitor auth ---
@api_router.post("/auth/register")
async def register(payload: RegisterIn, request: Request):
    rate_limit("auth", client_ip(request), max_hits=20)
    if not JWT_SECRET:
        raise api_error(503, "auth_not_configured", "Auth not configured")
    email = str(payload.email).lower()
    if await db.users.find_one({"email": email}):
        raise api_error(409, "email_taken", "An account already exists for this email")
    doc = {
        "name": f"{payload.first_name.strip()} {payload.last_name.strip()}",
        "first_name": payload.first_name.strip(),
        "last_name": payload.last_name.strip(),
        "email": email,
        "phone": None,
        "preferred_language": payload.preferred_language,
        "application_ref": payload.application_ref,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    return {"token": create_access_token(str(result.inserted_id)), "user": public_user({**doc, "_id": result.inserted_id})}


@api_router.post("/auth/login")
async def login(payload: LoginIn, request: Request):
    rate_limit("auth", client_ip(request), max_hits=20)
    email = str(payload.email).lower()
    doc = await db.users.find_one({"email": email})
    if not doc or not verify_password(payload.password, doc.get("password_hash", "")):
        raise api_error(401, "invalid_credentials", "Wrong email or password")
    return {"token": create_access_token(str(doc["_id"])), "user": public_user(doc)}


@api_router.get("/auth/me")
async def me(request: Request):
    user = await current_user(request)
    out = public_user(user)
    if user.get("application_ref"):
        try:
            app_doc = await db.applications.find_one({"_id": ObjectId(user["application_ref"])}, {"_id": 0})
            out["application"] = app_doc
        except Exception:
            out["application"] = None
    return {"user": out}


@api_router.put("/auth/me")
async def update_me(payload: ProfileIn, request: Request):
    user = await current_user(request)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
    return {"ok": True}


# --- Admin routes ---
@api_router.get("/admin/leads", dependencies=[Depends(admin_guard)])
async def admin_list_leads():
    docs = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"leads": docs}


@api_router.get("/admin/registrations", dependencies=[Depends(admin_guard)])
async def admin_list_registrations():
    docs = await db.workshop_registrations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"registrations": docs}


@api_router.get("/admin/applications", dependencies=[Depends(admin_guard)])
async def admin_list_applications():
    docs = await db.applications.find({}).sort("created_at", -1).to_list(1000)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return {"applications": docs}


@api_router.get("/admin/scenarios", dependencies=[Depends(admin_guard)])
async def admin_list_scenarios(
    path: Optional[str] = None,
    language: Optional[str] = None,
    from_date: Optional[str] = Query(default=None, alias="from"),
    to_date: Optional[str] = Query(default=None, alias="to"),
):
    query: dict = {}
    if path in ("purchase", "refinance"):
        query["path"] = path
    if language in ("en", "es"):
        query["language"] = language
    if from_date:
        query.setdefault("created_at", {})["$gte"] = from_date
    if to_date:
        query.setdefault("created_at", {})["$lte"] = f"{to_date}T23:59:59" if "T" not in to_date else to_date
    docs = await db.scenarios.find(query, {"_id": 0}).sort("created_at", -1).to_list(2000)
    per_day: dict = defaultdict(int)
    for d in docs:
        per_day[str(d.get("created_at", ""))[:10]] += 1
    counts = [{"date": day, "count": n} for day, n in sorted(per_day.items(), reverse=True)]
    return {"scenarios": docs, "per_day": counts, "total": len(docs)}


@api_router.post("/admin/scenarios/purge", dependencies=[Depends(admin_guard)])
async def admin_purge_scenarios():
    days = await _retention_days()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    result = await db.scenarios.delete_many({"created_at": {"$lt": cutoff}})
    return {"ok": True, "deleted": result.deleted_count, "retention_days": days}


@api_router.get("/admin/deliveries", dependencies=[Depends(admin_guard)])
async def admin_list_deliveries():
    docs = await db.webhook_deliveries.find({}, {"_id": 0, "body": 0}).sort("created_at", -1).to_list(200)
    return {"deliveries": docs, "webhook_configured": webhooks.configured()}


@api_router.post("/admin/deliveries/{delivery_id}/resend", dependencies=[Depends(admin_guard)])
async def admin_resend_delivery(delivery_id: str):
    if not webhooks.configured():
        raise api_error(409, "webhook_not_configured", "webhook not configured")
    doc = await db.webhook_deliveries.find_one_and_update(
        {"id": delivery_id},
        {"$set": {"status": "pending", "next_attempt_at": datetime.now(timezone.utc).isoformat()}},
    )
    if not doc:
        raise api_error(404, "delivery_not_found", "Delivery not found")
    asyncio.get_running_loop().create_task(webhooks.attempt_delivery(db, delivery_id))
    return {"ok": True}


@api_router.get("/admin/concierge/stats", dependencies=[Depends(admin_guard)])
async def admin_concierge_stats():
    pipeline = [{"$group": {"_id": "$route", "count": {"$sum": 1}}}]
    rows = await db.concierge_turns.aggregate(pipeline).to_list(50)
    return {"routes": [{"route": r["_id"], "count": r["count"]} for r in rows], "prompt_version": concierge_config.PROMPT_VERSION}


async def _retention_days() -> int:
    doc = await db.settings.find_one({"key": "retention"})
    return int(doc.get("days", 180)) if doc else 180


@api_router.get("/admin/settings", dependencies=[Depends(admin_guard)])
async def admin_get_settings():
    return {"retention_days": await _retention_days(), "webhook_configured": webhooks.configured()}


class SettingsIn(BaseModel):
    retention_days: int = Field(ge=1, le=3650)


@api_router.put("/admin/settings", dependencies=[Depends(admin_guard)])
async def admin_put_settings(payload: SettingsIn):
    await db.settings.update_one({"key": "retention"}, {"$set": {"key": "retention", "days": payload.retention_days}}, upsert=True)
    return {"ok": True, "retention_days": payload.retention_days}


@api_router.get("/admin/export.csv", dependencies=[Depends(admin_guard)])
async def admin_export_csv(kind: str = "leads"):
    if kind == "leads":
        docs = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
        fields = ["created_at", "name", "email", "phone", "preferred_language", "path_interest", "message"]
        return _csv_response(docs, fields, "leads.csv")
    if kind == "registrations":
        docs = await db.workshop_registrations.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
        fields = ["created_at", "workshop_id", "name", "email", "phone", "preferred_language"]
        return _csv_response(docs, fields, "registrations.csv")
    if kind == "applications":
        docs = await db.applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
        fields = ["created_at", "path", "name", "email", "phone", "preferred_language", "city", "home_value", "existing_financing", "initial_share", "scenario_id"]
        return _csv_response(docs, fields, "applications.csv")
    if kind == "scenarios":
        docs = await db.scenarios.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
        for d in docs:
            d["figures"] = webhooks.compact_json(d.get("figures") or {})
        fields = ["created_at", "id", "language", "path", "page", "session", "campaign", "application_id", "figures"]
        return _csv_response(docs, fields, "scenarios.csv")
    raise api_error(400, "unknown_export_kind", "Unknown export kind")


# --- Cron endpoints (called by the cron container, see deploy/cron.sh) ---
async def cron_guard(request: Request, authorization: Optional[str] = Header(default=None)):
    if not CRON_SECRET:
        raise api_error(503, "cron_not_configured", "Cron not configured")
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else ""
    if not token or not secrets.compare_digest(token, CRON_SECRET):
        raise api_error(401, "invalid_cron_token", "Invalid cron token")
    try:
        body = await request.json()
    except Exception:
        raise api_error(400, "invalid_body", "Invalid request body")
    run_id = (body or {}).get("run_id") or request.headers.get("X-Webhook-Id") or ""
    if run_id:
        try:
            await db.cron_runs.insert_one({"run_id": run_id, "created_at": datetime.now(timezone.utc).isoformat()})
        except Exception:
            return False  # duplicate delivery: ack without reworking
    return True


@api_router.post("/cron/webhook-sweep")
async def cron_webhook_sweep(fresh: bool = Depends(cron_guard)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    if fresh:
        asyncio.get_running_loop().create_task(webhooks.sweep_due(db))
    return {"ok": True, "duplicate": not fresh}


@api_router.post("/cron/purge-scenarios")
async def cron_purge_scenarios(fresh: bool = Depends(cron_guard)):
    # Cron endpoints must ack 2xx immediately; enqueue/background the actual work.
    if fresh:
        async def _purge():
            days = await _retention_days()
            cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
            await db.scenarios.delete_many({"created_at": {"$lt": cutoff}})
        asyncio.get_running_loop().create_task(_purge())
    return {"ok": True, "duplicate": not fresh}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def create_indexes():
    await db.users.create_index("email", unique=True)
    await db.scenarios.create_index("id", unique=True)
    await db.webhook_deliveries.create_index("id", unique=True)
    await db.cron_runs.create_index("run_id", unique=True)
    await db.concierge_turns.create_index("created_at")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
