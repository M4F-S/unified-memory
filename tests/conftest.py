import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Set env vars before any module-level code in local_server reads them
os.environ.setdefault("OPENROUTER_API_KEY", "test-key")
os.environ.setdefault("PINECONE_API_KEY",   "test-key")
os.environ.setdefault("PINECONE_HOST",      "test-host.svc.gcp-starter.pinecone.io")
os.environ.setdefault("NEAR_CONTRACT_ID",   "test.testnet")
os.environ.setdefault("NEAR_RPC",           "https://rpc.testnet.near.org")
os.environ.setdefault("CIRCLE_WALLET_ADDRESS", "0xTEST_WALLET")

import pytest
from fastapi.testclient import TestClient
from workers.local_server import app

@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)

# ── Shared mock payloads ───────────────────────────────────────────────────────

VALID_VALIDATION = {"valid": True, "reason": "", "remaining_queries": 99}
REVOKED_VALIDATION = {"valid": False, "reason": "Consent revoked"}
EXPIRED_VALIDATION = {"valid": False, "reason": "Consent expired"}

MOCK_CONSENT = {
    "is_active": True,
    "revoked_at": None,
    "queries_used": 1,
    "max_queries": 100,
    "usdc_spent": 0.001,
    "max_usdc_budget": 1.0,
    "expires_at": "9999999999999",
    "owner": "alice.testnet",
}

MOCK_EMBEDDING = [0.01] * 1536

MOCK_CLASSIFIED = {
    "type": "episodic",
    "summary": "Test memory summary",
    "importance": 7,
    "tags": ["test", "memory"],
}

MOCK_MATCHES = [
    {
        "id": "mem-001",
        "score": 0.92,
        "metadata": {
            "content": "Committed NEAR contract",
            "summary": "User committed the NEAR contract",
            "platform": "github",
            "memory_type": "episodic",
            "timestamp": "2026-06-20T10:00:00",
        },
    }
]
