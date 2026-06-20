"""
Tests for POST /ingest/upload — the file-upload connector pipeline.
Runs the REAL connector parser on a tiny fixture, but patches synthesize_batch
so no embedding/Pinecone network is touched. Auth-gated by the JWT.
"""
import io
import json
import uuid

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def ingest_client(tmp_path, monkeypatch):
    import workers.auth as auth
    monkeypatch.setattr(auth, "_DATA_DIR", tmp_path)
    monkeypatch.setattr(auth, "_USERS_FILE", tmp_path / "users.json")
    # Avoid embedding/Pinecone: count = number of parsed memories.
    import ingestion.run as run
    monkeypatch.setattr(run, "synthesize_batch", lambda memories, user_id, **kw: len(memories))
    from workers.local_server import app
    return TestClient(app, raise_server_exceptions=False)


def _token(client) -> tuple[str, str]:
    email = f"vault_{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/auth/register", json={"email": email, "password": "supersecret"})
    return r.json()["token"], r.json()["id"]


CHATGPT_EXPORT = json.dumps([
    {
        "title": "Deploy NEAR contract",
        "create_time": 1_700_000_000,
        "mapping": {"a": {"message": {
            "author": {"role": "user"},
            "content": {"parts": ["how do I deploy a NEAR contract?"]},
        }}},
    },
    {
        "title": "Pinecone setup",
        "create_time": 1_700_001_000,
        "mapping": {"b": {"message": {
            "author": {"role": "user"},
            "content": {"parts": ["seed a pinecone namespace"]},
        }}},
    },
])


def test_upload_requires_auth(ingest_client):
    r = ingest_client.post(
        "/ingest/upload",
        data={"platform": "chatgpt"},
        files={"file": ("conversations.json", io.BytesIO(b"[]"), "application/json")},
    )
    assert r.status_code == 401


def test_upload_rejects_unsupported_platform(ingest_client):
    token, _ = _token(ingest_client)
    r = ingest_client.post(
        "/ingest/upload",
        headers={"Authorization": f"Bearer {token}"},
        data={"platform": "github"},
        files={"file": ("x.json", io.BytesIO(b"[]"), "application/json")},
    )
    assert r.status_code == 400


def test_upload_chatgpt_into_user_vault(ingest_client):
    token, user_id = _token(ingest_client)
    r = ingest_client.post(
        "/ingest/upload",
        headers={"Authorization": f"Bearer {token}"},
        data={"platform": "chatgpt"},
        files={"file": ("conversations.json", io.BytesIO(CHATGPT_EXPORT.encode()), "application/json")},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["platform"] == "chatgpt"
    assert body["ingested"] == 2          # two user conversations parsed
    assert body["namespace"] == user_id   # lands in the logged-in user's vault


def test_upload_connectors_listed(ingest_client):
    body = ingest_client.get("/ingest/upload/connectors").json()
    platforms = {c["platform"] for c in body["connectors"]}
    assert platforms == {"chatgpt", "claude", "telegram"}
