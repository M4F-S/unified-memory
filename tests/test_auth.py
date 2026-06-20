"""
Auth endpoint tests (workers/auth.py): register → login → me, plus the failure
modes. File-backed store is redirected to a tmp_path so tests never touch real
data/users.json. No network.
"""
import importlib
import uuid

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def auth_client(tmp_path, monkeypatch):
    # Point the JSON store at a throwaway file before the app imports the router.
    import workers.auth as auth
    monkeypatch.setattr(auth, "_DATA_DIR", tmp_path)
    monkeypatch.setattr(auth, "_USERS_FILE", tmp_path / "users.json")
    from workers.local_server import app
    return TestClient(app, raise_server_exceptions=False)


def _email():
    return f"user_{uuid.uuid4().hex[:8]}@example.com"


def test_register_returns_id_email_token(auth_client):
    r = auth_client.post("/auth/register", json={"email": _email(), "password": "supersecret"})
    assert r.status_code == 200
    body = r.json()
    assert set(body) == {"id", "email", "token"}
    assert body["token"]


def test_register_rejects_weak_password_and_bad_email(auth_client):
    assert auth_client.post("/auth/register", json={"email": _email(), "password": "short"}).status_code == 422
    assert auth_client.post("/auth/register", json={"email": "not-an-email", "password": "supersecret"}).status_code == 422


def test_duplicate_email_conflicts(auth_client):
    em = _email()
    assert auth_client.post("/auth/register", json={"email": em, "password": "supersecret"}).status_code == 200
    assert auth_client.post("/auth/register", json={"email": em, "password": "supersecret"}).status_code == 409


def test_login_and_me_roundtrip(auth_client):
    em = _email()
    auth_client.post("/auth/register", json={"email": em, "password": "supersecret"})
    login = auth_client.post("/auth/login", json={"email": em, "password": "supersecret"})
    assert login.status_code == 200
    token = login.json()["token"]

    me = auth_client.post("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == em


def test_login_wrong_password_unauthorized(auth_client):
    em = _email()
    auth_client.post("/auth/register", json={"email": em, "password": "supersecret"})
    assert auth_client.post("/auth/login", json={"email": em, "password": "WRONGpass"}).status_code == 401


def test_me_requires_valid_bearer(auth_client):
    assert auth_client.post("/auth/me").status_code == 401
    assert auth_client.post("/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_users_debug_never_leaks_hashes(auth_client):
    auth_client.post("/auth/register", json={"email": _email(), "password": "supersecret"})
    body = auth_client.get("/auth/users").json()
    assert body["count"] >= 1
    assert all("password_hash" not in u for u in body["users"])
