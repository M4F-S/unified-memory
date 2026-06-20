# workers/auth.py
# Email/password auth for the demo: bcrypt-hashed passwords in a JSON file +
# JWT bearer tokens. Mounted on the FastAPI host (workers/local_server.py) via
# app.include_router(auth_router). Intentionally file-backed (data/users.json) —
# no DB to stand up for the hackathon demo.

import json
import os
import re
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from fastapi import APIRouter, Header, HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-insecure-secret-change-me-in-prod-0123456789")
JWT_ALG = "HS256"
JWT_TTL_HOURS = int(os.getenv("JWT_TTL_HOURS", "24"))

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_USERS_FILE = _DATA_DIR / "users.json"
_LOCK = threading.Lock()

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# bcrypt only hashes the first 72 bytes; reject longer so behaviour is honest.
_MAX_PASSWORD_BYTES = 72


# ── Models ─────────────────────────────────────────────────────────────────────

class RegisterBody(BaseModel):
    email: str
    password: str


class LoginBody(BaseModel):
    email: str
    password: str


# ── JSON store (file-backed, lock-guarded) ─────────────────────────────────────

def _load_users() -> list[dict]:
    if not _USERS_FILE.exists():
        return []
    try:
        return json.loads(_USERS_FILE.read_text("utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _save_users(users: list[dict]) -> None:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = _USERS_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(users, indent=2), "utf-8")
    tmp.replace(_USERS_FILE)


def _find_by_email(users: list[dict], email: str) -> dict | None:
    email = email.strip().lower()
    return next((u for u in users if u["email"] == email), None)


# ── JWT helpers ────────────────────────────────────────────────────────────────

def _make_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "iat": now,
        "exp": now + timedelta(hours=JWT_TTL_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def _decode_token(authorization: str | None) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _public(user: dict) -> dict:
    return {"id": user["id"], "email": user["email"]}


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/register")
def register(body: RegisterBody):
    email = body.email.strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Invalid email address")
    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    if len(body.password.encode("utf-8")) > _MAX_PASSWORD_BYTES:
        raise HTTPException(status_code=422, detail="Password must be at most 72 bytes")

    with _LOCK:
        users = _load_users()
        if _find_by_email(users, email):
            raise HTTPException(status_code=409, detail="Email already registered")
        user = {
            "id": uuid.uuid4().hex,
            "email": email,
            "password_hash": pwd_context.hash(body.password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        users.append(user)
        _save_users(users)

    return {**_public(user), "token": _make_token(user)}


@router.post("/login")
def login(body: LoginBody):
    email = body.email.strip().lower()
    with _LOCK:
        users = _load_users()
        user = _find_by_email(users, email)
    if not user or not pwd_context.verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {**_public(user), "token": _make_token(user)}


@router.post("/me")
def me(authorization: str | None = Header(default=None)):
    payload = _decode_token(authorization)
    with _LOCK:
        users = _load_users()
        user = next((u for u in users if u["id"] == payload.get("sub")), None)
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return _public(user)


@router.get("/users")
def list_users():
    """Debug endpoint — returns users WITHOUT password hashes."""
    return {"users": [_public(u) for u in _load_users()], "count": len(_load_users())}
