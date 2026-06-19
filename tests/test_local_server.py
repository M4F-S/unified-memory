"""
Unit tests for workers/local_server.py  (FastAPI fallback MCP server)
All external I/O (NEAR RPC, OpenRouter, Pinecone) is mocked.
"""
from unittest.mock import AsyncMock, patch, MagicMock
import pytest

from .conftest import (
    VALID_VALIDATION, REVOKED_VALIDATION, EXPIRED_VALIDATION,
    MOCK_CONSENT, MOCK_EMBEDDING, MOCK_CLASSIFIED, MOCK_MATCHES,
)

PATCH = "workers.local_server"


# ── /health ────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_returns_ok(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok", "service": "UnifiedMemory local MCP server"}


# ── GET /.well-known/mcp ──────────────────────────────────────────────────────

class TestMcpManifest:
    def test_returns_200(self, client):
        r = client.get("/.well-known/mcp")
        assert r.status_code == 200

    def test_has_three_tools(self, client):
        tools = client.get("/.well-known/mcp").json()["tools"]
        names = [t["name"] for t in tools]
        assert "recall_memory" in names
        assert "add_memory" in names
        assert "get_memory_stats" in names

    def test_recall_memory_required_fields(self, client):
        schema = next(
            t["inputSchema"] for t in client.get("/.well-known/mcp").json()["tools"]
            if t["name"] == "recall_memory"
        )
        assert "query" in schema["required"]
        assert "token_id" in schema["required"]

    def test_manifest_has_name_and_version(self, client):
        body = client.get("/.well-known/mcp").json()
        assert body["name"] == "UnifiedMemory"
        assert "version" in body


# ── POST /mcp/recall_memory ───────────────────────────────────────────────────

class TestRecallMemory:
    BASE = "/mcp/recall_memory"
    PAID = {"X-PAYMENT": "pay:base-sepolia:1000"}

    def _post(self, client, body, headers=None):
        return client.post(self.BASE, json=body, headers=headers or {})

    # 400 — missing required fields
    def test_missing_query_returns_400(self, client):
        r = self._post(client, {"token_id": "tok_1"})
        assert r.status_code == 400

    def test_missing_token_id_returns_400(self, client):
        r = self._post(client, {"query": "projects"})
        assert r.status_code == 400

    def test_empty_body_returns_422_or_400(self, client):
        r = client.post(self.BASE, json={})
        assert r.status_code in (400, 422)

    # 503 — NEAR RPC unavailable
    def test_near_rpc_error_returns_503(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.side_effect = RuntimeError("NEAR RPC timeout")
            r = self._post(client, {"query": "projects", "token_id": "tok_1"})
        assert r.status_code == 503
        assert "NEAR error" in r.json()["error"]["message"]

    # 403 — consent denied
    def test_revoked_consent_returns_403(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.return_value = REVOKED_VALIDATION
            r = self._post(client, {"query": "projects", "token_id": "tok_1"})
        assert r.status_code == 403
        assert "Consent revoked" in r.json()["error"]["message"]

    def test_expired_consent_returns_403(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.return_value = EXPIRED_VALIDATION
            r = self._post(client, {"query": "projects", "token_id": "tok_1"})
        assert r.status_code == 403

    # 402 — no payment
    def test_missing_payment_header_returns_402(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.return_value = VALID_VALIDATION
            r = self._post(client, {"query": "projects", "token_id": "tok_1"})
        assert r.status_code == 402
        assert "PAYMENT-REQUIRED" in r.headers

    def test_payment_challenge_contains_wallet(self, client):
        import json as _json
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.return_value = VALID_VALIDATION
            r = self._post(client, {"query": "projects", "token_id": "tok_1"})
        challenge = _json.loads(r.headers["PAYMENT-REQUIRED"])
        assert "payTo" in challenge
        assert challenge["network"] == "base-sepolia"

    # 200 — success
    def test_success_returns_memories(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mn, \
             patch(f"{PATCH}.get_embedding", new_callable=AsyncMock) as me, \
             patch(f"{PATCH}.pinecone_query", new_callable=AsyncMock) as mp:
            mn.return_value = VALID_VALIDATION
            me.return_value = MOCK_EMBEDDING
            mp.return_value = MOCK_MATCHES
            r = self._post(
                client,
                {"query": "projects", "token_id": "tok_1"},
                headers=self.PAID,
            )
        assert r.status_code == 200
        body = r.json()
        assert body["jsonrpc"] == "2.0"
        assert "memories" in body["result"]
        assert len(body["result"]["memories"]) == 1
        assert body["result"]["query_cost_usdc"] == 0.001

    def test_success_memories_have_required_fields(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mn, \
             patch(f"{PATCH}.get_embedding", new_callable=AsyncMock) as me, \
             patch(f"{PATCH}.pinecone_query", new_callable=AsyncMock) as mp:
            mn.return_value = VALID_VALIDATION
            me.return_value = MOCK_EMBEDDING
            mp.return_value = MOCK_MATCHES
            r = self._post(
                client,
                {"query": "projects", "token_id": "tok_1"},
                headers=self.PAID,
            )
        mem = r.json()["result"]["memories"][0]
        for field in ("content", "summary", "source", "type", "timestamp", "score"):
            assert field in mem, f"missing field: {field}"

    def test_remaining_queries_decremented(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mn, \
             patch(f"{PATCH}.get_embedding", new_callable=AsyncMock) as me, \
             patch(f"{PATCH}.pinecone_query", new_callable=AsyncMock) as mp:
            mn.return_value = VALID_VALIDATION  # remaining_queries = 99
            me.return_value = MOCK_EMBEDDING
            mp.return_value = []
            r = self._post(
                client,
                {"query": "q", "token_id": "tok_1"},
                headers=self.PAID,
            )
        assert r.json()["result"]["remaining_queries"] == 98

    def test_memory_type_filter_applied(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mn, \
             patch(f"{PATCH}.get_embedding", new_callable=AsyncMock) as me, \
             patch(f"{PATCH}.pinecone_query", new_callable=AsyncMock) as mp:
            mn.return_value = VALID_VALIDATION
            me.return_value = MOCK_EMBEDDING
            mp.return_value = []
            self._post(
                client,
                {"query": "q", "token_id": "tok_1", "memory_type": "episodic"},
                headers=self.PAID,
            )
            args = mp.call_args.args  # (embedding, filter_)
            filter_ = args[1]
            assert filter_["memory_type"] == {"$eq": "episodic"}

    def test_platform_filter_applied(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mn, \
             patch(f"{PATCH}.get_embedding", new_callable=AsyncMock) as me, \
             patch(f"{PATCH}.pinecone_query", new_callable=AsyncMock) as mp:
            mn.return_value = VALID_VALIDATION
            me.return_value = MOCK_EMBEDDING
            mp.return_value = []
            self._post(
                client,
                {"query": "q", "token_id": "tok_1", "platform": "gmail"},
                headers=self.PAID,
            )
            filter_ = mp.call_args.args[1]
            assert filter_["platform"] == {"$eq": "gmail"}

    def test_all_platform_no_filter(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mn, \
             patch(f"{PATCH}.get_embedding", new_callable=AsyncMock) as me, \
             patch(f"{PATCH}.pinecone_query", new_callable=AsyncMock) as mp:
            mn.return_value = VALID_VALIDATION
            me.return_value = MOCK_EMBEDDING
            mp.return_value = []
            self._post(
                client,
                {"query": "q", "token_id": "tok_1", "platform": "all"},
                headers=self.PAID,
            )
            filter_ = mp.call_args.args[1]
            assert "platform" not in filter_

    def test_empty_pinecone_result(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mn, \
             patch(f"{PATCH}.get_embedding", new_callable=AsyncMock) as me, \
             patch(f"{PATCH}.pinecone_query", new_callable=AsyncMock) as mp:
            mn.return_value = VALID_VALIDATION
            me.return_value = MOCK_EMBEDDING
            mp.return_value = []
            r = self._post(client, {"query": "xyz", "token_id": "tok_1"}, headers=self.PAID)
        assert r.status_code == 200
        assert r.json()["result"]["memories"] == []


# ── POST /mcp/add_memory ──────────────────────────────────────────────────────

class TestAddMemory:
    BASE = "/mcp/add_memory"

    def _post(self, client, body):
        return client.post(self.BASE, json=body)

    VALID_BODY = {
        "content": "Deployed NEAR contract successfully",
        "memory_type": "episodic",
        "source": "github",
        "token_id": "tok_1",
    }

    # 400 — missing fields
    def test_missing_content_returns_400(self, client):
        body = {**self.VALID_BODY}
        del body["content"]
        assert self._post(client, body).status_code == 400

    def test_missing_memory_type_returns_400(self, client):
        body = {**self.VALID_BODY}
        del body["memory_type"]
        assert self._post(client, body).status_code == 400

    def test_missing_source_returns_400(self, client):
        body = {**self.VALID_BODY}
        del body["source"]
        assert self._post(client, body).status_code == 400

    def test_missing_token_id_returns_400(self, client):
        body = {**self.VALID_BODY}
        del body["token_id"]
        assert self._post(client, body).status_code == 400

    # 503 — NEAR error
    def test_near_rpc_error_returns_503(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.side_effect = RuntimeError("NEAR timeout")
            r = self._post(client, self.VALID_BODY)
        assert r.status_code == 503

    # 403 — consent denied
    def test_revoked_consent_returns_403(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.return_value = REVOKED_VALIDATION
            r = self._post(client, self.VALID_BODY)
        assert r.status_code == 403

    # 200 — success
    def test_success_returns_memory_id(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mn, \
             patch(f"{PATCH}.classify_memory", new_callable=AsyncMock) as mc, \
             patch(f"{PATCH}.get_embedding", new_callable=AsyncMock) as me, \
             patch(f"{PATCH}.pinecone_upsert", new_callable=AsyncMock) as mu:
            mn.return_value = VALID_VALIDATION
            mc.return_value = MOCK_CLASSIFIED
            me.return_value = MOCK_EMBEDDING
            mu.return_value = None
            r = self._post(client, self.VALID_BODY)
        assert r.status_code == 200
        body = r.json()
        assert body["jsonrpc"] == "2.0"
        assert "memory_id" in body["result"]
        assert body["result"]["type"] == "episodic"
        assert body["result"]["importance_score"] == 7

    def test_memory_id_contains_source(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mn, \
             patch(f"{PATCH}.classify_memory", new_callable=AsyncMock) as mc, \
             patch(f"{PATCH}.get_embedding", new_callable=AsyncMock) as me, \
             patch(f"{PATCH}.pinecone_upsert", new_callable=AsyncMock) as mu:
            mn.return_value = VALID_VALIDATION
            mc.return_value = MOCK_CLASSIFIED
            me.return_value = MOCK_EMBEDDING
            mu.return_value = None
            r = self._post(client, self.VALID_BODY)
        memory_id = r.json()["result"]["memory_id"]
        assert "github" in memory_id

    def test_pinecone_upsert_called_once(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mn, \
             patch(f"{PATCH}.classify_memory", new_callable=AsyncMock) as mc, \
             patch(f"{PATCH}.get_embedding", new_callable=AsyncMock) as me, \
             patch(f"{PATCH}.pinecone_upsert", new_callable=AsyncMock) as mu:
            mn.return_value = VALID_VALIDATION
            mc.return_value = MOCK_CLASSIFIED
            me.return_value = MOCK_EMBEDDING
            mu.return_value = None
            self._post(client, self.VALID_BODY)
        mu.assert_called_once()


# ── POST /mcp/get_memory_stats ────────────────────────────────────────────────

class TestGetMemoryStats:
    BASE = "/mcp/get_memory_stats"

    # 400 — missing token_id
    def test_missing_token_id_returns_400(self, client):
        r = client.post(self.BASE, json={})
        assert r.status_code == 400

    # 404 — token not found
    def test_token_not_found_returns_404(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.side_effect = RuntimeError("not found")
            r = client.post(self.BASE, json={"token_id": "bad_tok"})
        assert r.status_code == 404

    # 200 — success
    def test_success_active_nft(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock, \
             patch(f"{PATCH}.httpx.AsyncClient") as _:
            mock.return_value = MOCK_CONSENT
            r = client.post(self.BASE, json={"token_id": "tok_1"})
        assert r.status_code == 200
        body = r.json()
        assert body["jsonrpc"] == "2.0"
        result = body["result"]
        assert result["nft_status"] == "active"

    def test_success_contains_quota_fields(self, client):
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.return_value = MOCK_CONSENT
            r = client.post(self.BASE, json={"token_id": "tok_1"})
        result = r.json()["result"]
        for field in ("queries_used", "queries_remaining", "usdc_spent", "usdc_remaining", "expires_at"):
            assert field in result, f"missing field: {field}"

    def test_revoked_nft_status(self, client):
        revoked_consent = {**MOCK_CONSENT, "is_active": False, "revoked_at": "1750000000000000000"}
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.return_value = revoked_consent
            r = client.post(self.BASE, json={"token_id": "tok_1"})
        assert r.json()["result"]["nft_status"] == "revoked"

    def test_expired_nft_status(self, client):
        expired_consent = {**MOCK_CONSENT, "is_active": False, "revoked_at": None}
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.return_value = expired_consent
            r = client.post(self.BASE, json={"token_id": "tok_1"})
        assert r.json()["result"]["nft_status"] == "expired"

    def test_queries_remaining_calculated(self, client):
        consent = {**MOCK_CONSENT, "queries_used": 10, "max_queries": 100}
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.return_value = consent
            r = client.post(self.BASE, json={"token_id": "tok_1"})
        assert r.json()["result"]["queries_remaining"] == 90

    def test_usdc_remaining_calculated(self, client):
        consent = {**MOCK_CONSENT, "usdc_spent": 0.25, "max_usdc_budget": 1.0}
        with patch(f"{PATCH}.near_view", new_callable=AsyncMock) as mock:
            mock.return_value = consent
            r = client.post(self.BASE, json={"token_id": "tok_1"})
        assert abs(r.json()["result"]["usdc_remaining"] - 0.75) < 1e-9
