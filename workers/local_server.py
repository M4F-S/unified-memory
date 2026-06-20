# workers/local_server.py
# FastAPI fallback — same API as the Cloudflare Worker
# Run: uvicorn workers.local_server:app --host 0.0.0.0 --port 8000

import os, sys, base64, hashlib, json, tempfile, zipfile
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, Request, UploadFile, File, Form, Depends, Header, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
from dotenv import load_dotenv

load_dotenv()

# Consent-management (mint/revoke) needs to SIGN NEAR transactions, which the
# proven near-cli wrapper in demo/near_consent.py already does. Import it here so
# the FastAPI host can expose /api/mint and /api/revoke. Guarded so a missing
# near-cli / import never breaks the read-only MCP surface or the test suite.
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
try:
    from demo.near_consent import mint_consent, revoke_consent as near_revoke, NearError
    _SIGNING_OK, _SIGNING_ERR = True, ""
except Exception as _imp_err:  # pragma: no cover - only on hosts without near-cli deps
    _SIGNING_OK, _SIGNING_ERR = False, str(_imp_err)

# token_id "0" is the shared, seeded baseline the API tests + demo recall rely on.
# revoke_consent is irreversible, so the API must never burn it.
PROTECTED_TOKENS = {"0"}

app = FastAPI(title="UnifiedMemory MCP Server (local fallback)")
# expose_headers lets browser clients read the x402 `PAYMENT-REQUIRED` challenge.
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
    expose_headers=["PAYMENT-REQUIRED"],
)

# Email/password auth (bcrypt + JWT) for the demo frontend. Guarded so a missing
# auth dep never takes down the MCP surface or the existing test suite.
try:
    from workers.auth import router as auth_router, current_user
    app.include_router(auth_router)
    _AUTH_OK = True
except Exception as _auth_err:  # pragma: no cover - only on hosts without auth deps
    _AUTH_OK = False

    def current_user(authorization: str | None = Header(default=None)):
        raise HTTPException(status_code=503, detail="Auth unavailable")

# Connector ingestion pipeline (file-upload parsers). Guarded so a host missing
# the heavy ingestion deps (pinecone/openai) still serves the rest of the API.
try:
    from ingestion.run import run_connector
    _INGEST_OK = True
except Exception as _ingest_err:  # pragma: no cover - only on hosts without ingest deps
    _INGEST_OK = False

# JSON export parsers that work from a single uploaded file (no OAuth / API keys).
UPLOAD_CONNECTORS = {"chatgpt", "claude", "telegram"}

# Real platform exports ship as a .zip; the parser only needs the inner JSON.
# Map each connector to the file it expects inside the archive.
ZIP_INNER_FILE = {"chatgpt": "conversations.json", "claude": "conversations.json", "telegram": "result.json"}


def _extract_export_from_zip(zip_path: str, platform: str) -> str:
    """Pull the connector's JSON file out of an uploaded .zip into a temp file.

    Prefers the platform's expected name (e.g. chatgpt -> conversations.json),
    then any matching basename anywhere in the archive, then the first .json.
    Returns the path to the extracted temp file (caller cleans it up).
    """
    want = ZIP_INNER_FILE.get(platform, "").lower()
    with zipfile.ZipFile(zip_path) as zf:
        names = [n for n in zf.namelist() if not n.endswith("/")]
        json_names = [n for n in names if n.lower().endswith(".json")]
        match = (
            next((n for n in json_names if Path(n).name.lower() == want), None)
            or next((n for n in json_names if want and want in n.lower()), None)
            or (json_names[0] if json_names else None)
        )
        if not match:
            raise ValueError(f"No JSON export found inside the .zip for '{platform}'")
        data = zf.read(match)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".json") as fh:
        fh.write(data)
        return fh.name

NEAR_RPC         = os.getenv("NEAR_RPC", "https://rpc.testnet.near.org")
NEAR_CONTRACT_ID = os.getenv("NEAR_CONTRACT_ID", "consent-nft.testnet")
OPENROUTER_KEY   = os.getenv("OPENROUTER_API_KEY", "")
PINECONE_KEY     = os.getenv("PINECONE_API_KEY", "")
PINECONE_HOST    = os.getenv("PINECONE_HOST", "")  # e.g. unified-memory-abc123.svc.gcp-starter.pinecone.io
CIRCLE_WALLET    = os.getenv("CIRCLE_WALLET_ADDRESS", "0xYOUR_WALLET")

OR_HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_KEY}",
    "HTTP-Referer": "https://github.com/M4F-S/unified-memory",
    "X-Title": "UnifiedMemory Hackathon",
}
PINECONE_HEADERS = {"Api-Key": PINECONE_KEY, "Content-Type": "application/json"}


# ── NEAR helpers ───────────────────────────────────────────────────────────────

async def near_view(method: str, args: dict) -> dict:
    args_b64 = base64.b64encode(json.dumps(args).encode()).decode()
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(NEAR_RPC, json={
            "jsonrpc": "2.0", "id": 1, "method": "query",
            "params": {
                "request_type": "call_function",
                "finality": "final",
                "account_id": NEAR_CONTRACT_ID,
                "method_name": method,
                "args_base64": args_b64
            }
        })
    data = resp.json()
    if "error" in data or not data.get("result", {}).get("result"):
        raise RuntimeError(f"NEAR RPC error on {method}: {data.get('error')}")
    return json.loads(bytes(data["result"]["result"]).decode("utf-8"))


# ── OpenRouter helpers ─────────────────────────────────────────────────────────

async def get_embedding(text: str) -> list[float]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/embeddings",
            headers=OR_HEADERS,
            json={"model": "openai/text-embedding-3-small", "input": text[:8000]}
        )
    return resp.json()["data"][0]["embedding"]


async def classify_memory(content: str, source: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=OR_HEADERS,
            json={
                "model": os.getenv("OPENROUTER_CLASSIFY_MODEL", "deepseek/deepseek-v3.2"),
                "messages": [
                    {"role": "system", "content": 'Classify memory. Return ONLY JSON: {"type":"episodic|semantic|procedural|social|preferential","summary":"1-2 sentences","importance":0-10,"tags":["tag1"]}'},
                    {"role": "user", "content": f"Platform: {source}\nContent: {content[:2000]}"}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1, "max_tokens": 150
            }
        )
    return json.loads(resp.json()["choices"][0]["message"]["content"])


# ── Pinecone helpers ───────────────────────────────────────────────────────────

async def pinecone_query(embedding: list, filter: dict, top_k: int = 5, namespace: str = "") -> list:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"https://{PINECONE_HOST}/query",
            headers=PINECONE_HEADERS,
            json={"vector": embedding, "filter": filter, "topK": top_k, "namespace": namespace, "includeMetadata": True}
        )
    return resp.json().get("matches", [])


async def pinecone_upsert(vectors: list, namespace: str):
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(
            f"https://{PINECONE_HOST}/vectors/upsert",
            headers=PINECONE_HEADERS,
            json={"vectors": vectors, "namespace": namespace}
        )


# ── x402 check ────────────────────────────────────────────────────────────────

def check_payment(request: Request, resource_url: str):
    if request.headers.get("X-PAYMENT"):
        return None
    return JSONResponse(
        status_code=402,
        content={"jsonrpc": "2.0", "error": {"code": -32402, "message": "Payment required"}},
        headers={
            "PAYMENT-REQUIRED": json.dumps({
                "scheme": "exact", "network": "base-sepolia",
                "maxAmountRequired": "1000", "resource": resource_url,
                "description": "Memory query — UnifiedMemory",
                "mimeType": "application/json", "payTo": CIRCLE_WALLET,
                "maxTimeoutSeconds": 30,
                "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
            })
        }
    )


# ── MCP Manifest ───────────────────────────────────────────────────────────────

@app.get("/.well-known/mcp")
def mcp_manifest():
    return {
        "name": "UnifiedMemory",
        "version": "1.0.0",
        "description": "Unified memory graph for AI agents — NEAR consent-controlled, x402-paid",
        "tools": [
            {
                "name": "recall_memory",
                "description": "Recall memories from the user's unified memory graph across 20+ platforms",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query":       {"type": "string"},
                        "memory_type": {"type": "string", "enum": ["episodic","semantic","procedural","social","preferential","all"], "default": "all"},
                        "platform":    {"type": "string", "default": "all"},
                        "token_id":    {"type": "string"}
                    },
                    "required": ["query", "token_id"]
                }
            },
            {
                "name": "add_memory",
                "description": "Store a new memory in the user's memory graph",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "content":     {"type": "string"},
                        "memory_type": {"type": "string"},
                        "source":      {"type": "string"},
                        "token_id":    {"type": "string"}
                    },
                    "required": ["content", "memory_type", "source", "token_id"]
                }
            },
            {
                "name": "get_memory_stats",
                "description": "Get NFT status and usage stats",
                "inputSchema": {
                    "type": "object",
                    "properties": {"token_id": {"type": "string"}},
                    "required": ["token_id"]
                }
            }
        ]
    }


# ── POST /mcp/recall_memory ───────────────────────────────────────────────────

@app.post("/mcp/recall_memory")
async def recall_memory(request: Request):
    body = await request.json()
    query       = body.get("query")
    memory_type = body.get("memory_type", "all")
    platform    = body.get("platform", "all")
    token_id    = body.get("token_id")

    if not query or not token_id:
        return JSONResponse(status_code=400, content={"jsonrpc": "2.0", "error": {"code": -32602, "message": "query and token_id are required"}})

    try:
        validation = await near_view("validate_query", {"token_id": token_id, "platform": platform, "memory_type": memory_type, "query_cost_usdc": 0.001})
    except Exception as e:
        return JSONResponse(status_code=503, content={"jsonrpc": "2.0", "error": {"code": -32603, "message": f"NEAR error: {e}"}})

    if not validation["valid"]:
        return JSONResponse(status_code=403, content={"jsonrpc": "2.0", "error": {"code": -32603, "message": f"Access denied: {validation['reason']}"}})

    payment_block = check_payment(request, str(request.url))
    if payment_block:
        return payment_block

    embedding = await get_embedding(query)
    filter_   = {}
    if memory_type != "all": filter_["memory_type"] = {"$eq": memory_type}
    if platform    != "all": filter_["platform"]     = {"$eq": platform}

    matches = await pinecone_query(embedding, filter_, namespace=token_id)

    return {
        "jsonrpc": "2.0",
        "result": {
            "memories": [
                {
                    "content":   m["metadata"]["content"],
                    "summary":   m["metadata"].get("summary", ""),
                    "source":    m["metadata"]["platform"],
                    "type":      m["metadata"]["memory_type"],
                    "timestamp": m["metadata"]["timestamp"],
                    "score":     m["score"]
                }
                for m in matches
            ],
            "query_cost_usdc":   0.001,
            "remaining_queries": validation["remaining_queries"] - 1
        }
    }


# ── POST /mcp/add_memory ──────────────────────────────────────────────────────

@app.post("/mcp/add_memory")
async def add_memory(request: Request):
    body = await request.json()
    content     = body.get("content")
    memory_type = body.get("memory_type")
    source      = body.get("source")
    token_id    = body.get("token_id")

    if not all([content, memory_type, source, token_id]):
        return JSONResponse(status_code=400, content={"jsonrpc": "2.0", "error": {"code": -32602, "message": "content, memory_type, source, token_id are required"}})

    try:
        validation = await near_view("validate_query", {"token_id": token_id, "platform": source, "memory_type": memory_type, "query_cost_usdc": 0.001})
    except Exception as e:
        return JSONResponse(status_code=503, content={"jsonrpc": "2.0", "error": {"code": -32603, "message": f"NEAR error: {e}"}})

    if not validation["valid"]:
        return JSONResponse(status_code=403, content={"jsonrpc": "2.0", "error": {"code": -32603, "message": f"Access denied: {validation['reason']}"}})

    classified = await classify_memory(content, source)
    embedding  = await get_embedding(classified["summary"])
    ph         = "0x" + hashlib.sha256(content.encode()).hexdigest()
    memory_id  = f"agent-{source}-{ph[2:18]}"

    await pinecone_upsert([{
        "id": memory_id,
        "values": embedding,
        "metadata": {
            "user_id": token_id, "content": content[:1000],
            "summary": classified["summary"], "memory_type": classified["type"],
            "platform": source, "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            "importance": classified["importance"], "tags": classified["tags"],
            "provenance_hash": ph, "url": ""
        }
    }], token_id)

    return {"jsonrpc": "2.0", "result": {"memory_id": memory_id, "type": classified["type"], "importance_score": classified["importance"]}}


# ── POST /mcp/get_memory_stats ────────────────────────────────────────────────

@app.post("/mcp/get_memory_stats")
async def get_memory_stats(request: Request):
    body     = await request.json()
    token_id = body.get("token_id")
    if not token_id:
        return JSONResponse(status_code=400, content={"jsonrpc": "2.0", "error": {"code": -32602, "message": "token_id is required"}})

    try:
        consent = await near_view("get_consent", {"token_id": token_id})
    except Exception:
        return JSONResponse(status_code=404, content={"jsonrpc": "2.0", "error": {"code": -32604, "message": "Token not found"}})

    total_memories = 0
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            stats_resp = await client.post(
                f"https://{PINECONE_HOST}/describe_index_stats",
                headers=PINECONE_HEADERS, json={"filter": {}}
            )
        total_memories = stats_resp.json().get("namespaces", {}).get(token_id, {}).get("vectorCount", 0)
    except Exception:
        pass

    nft_status = "active" if consent["is_active"] else ("revoked" if consent.get("revoked_at") else "expired")

    return {
        "jsonrpc": "2.0",
        "result": {
            "nft_status":        nft_status,
            "total_memories":    total_memories,
            "by_platform":       {},
            "by_type":           {},
            "queries_used":      consent["queries_used"],
            "queries_remaining": consent["max_queries"] - consent["queries_used"],
            "usdc_spent":        consent["usdc_spent"],
            "usdc_remaining":    consent["max_usdc_budget"] - consent["usdc_spent"],
            "expires_at":        __import__("datetime").datetime.utcfromtimestamp(int(consent["expires_at"]) / 1000).isoformat()
        }
    }


# ── Consent management (signing endpoints) ─────────────────────────────────────
# These mint/revoke real Consent NFTs on NEAR, so they need near-cli + the signer
# key and only run on the FastAPI host (the Cloudflare Worker can't sign on-chain).
# The frontend consent/onboard/dashboard pages call these.

@app.post("/api/mint")
async def api_mint(request: Request):
    """Mint a Consent NFT. Body (all optional, fall back to full demo scope):
    {agent_id, platforms[], types[], max_queries, max_usdc, expires_days}.
    Returns {token_id, tx_hash, explorer_url}."""
    if not _SIGNING_OK:
        return JSONResponse(status_code=503, content={"error": f"on-chain signing unavailable: {_SIGNING_ERR}"})
    body = await request.json()
    try:
        result = await run_in_threadpool(
            mint_consent,
            agent_id=body.get("agent_id"),
            allowed_platforms=body.get("platforms"),
            allowed_memory_types=body.get("types"),
            max_queries=body.get("max_queries"),
            max_usdc_budget=body.get("max_usdc"),
            expires_days=body.get("expires_days"),
        )
    except NearError as e:
        return JSONResponse(status_code=502, content={"error": f"NEAR mint failed: {str(e).splitlines()[0][:200]}"})
    return result


@app.post("/api/revoke/{token_id}")
async def api_revoke(token_id: str):
    """Revoke a Consent NFT on-chain. Returns {status, token_id, tx_hash, explorer_url}.
    Refuses the protected baseline token (revocation is irreversible)."""
    if not _SIGNING_OK:
        return JSONResponse(status_code=503, content={"error": f"on-chain signing unavailable: {_SIGNING_ERR}"})
    if token_id in PROTECTED_TOKENS:
        return JSONResponse(status_code=409, content={
            "error": f"Token {token_id} is the protected demo baseline and cannot be revoked via API. "
                     f"Mint a fresh token (POST /api/mint) to demonstrate revocation."})
    try:
        tx, url = await run_in_threadpool(near_revoke, token_id)
    except NearError as e:
        return JSONResponse(status_code=502, content={"error": f"NEAR revoke failed: {str(e).splitlines()[0][:200]}"})
    return {"status": "revoked", "token_id": token_id, "tx_hash": tx, "explorer_url": url}


@app.get("/api/consent/{token_id}")
async def api_consent(token_id: str):
    """Read on-chain consent metadata (view call — no signing). Returns
    {token_id, status, agent_id, owner, platforms, types, usage, expires_at}."""
    try:
        consent = await near_view("get_consent", {"token_id": token_id})
    except Exception as e:
        return JSONResponse(status_code=503, content={"error": f"NEAR error: {e}"})
    if not consent:
        return JSONResponse(status_code=404, content={"error": "Token not found"})
    status = "active" if consent["is_active"] else ("revoked" if consent.get("revoked_at") else "expired")
    expires_at = None
    if consent.get("expires_at"):
        expires_at = datetime.utcfromtimestamp(int(consent["expires_at"]) / 1000).isoformat()
    return {
        "token_id":        token_id,
        "status":          status,
        "agent_id":        consent.get("agent_id"),
        "owner":           consent.get("owner"),
        "platforms":       consent.get("allowed_platforms", []),
        "types":           consent.get("allowed_memory_types", []),
        "max_queries":     consent.get("max_queries"),
        "queries_used":    consent.get("queries_used"),
        "max_usdc_budget": consent.get("max_usdc_budget"),
        "usdc_spent":      consent.get("usdc_spent"),
        "expires_at":      expires_at,
    }


# ── Ingestion (file-upload connectors) ─────────────────────────────────────────

@app.get("/ingest/upload/connectors")
def ingest_upload_connectors():
    """List the upload-based connectors the frontend can offer (no auth)."""
    labels = {"chatgpt": "ChatGPT", "claude": "Claude", "telegram": "Telegram"}
    return {"connectors": [
        {"platform": p, "label": labels.get(p, p.title()), "auth": "upload", "accept": ".json,.zip"}
        for p in sorted(UPLOAD_CONNECTORS)
    ]}


@app.post("/ingest/upload")
async def ingest_upload(
    platform: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(current_user),
):
    """Ingest an uploaded export file into the logged-in user's vault.

    namespace = user id (per-user Pinecone namespace). Parses the file with the
    platform connector, then classifies + embeds + upserts via synthesize_batch.
    """
    if not _INGEST_OK:
        return JSONResponse(status_code=503, content={"error": "Ingestion backend unavailable"})
    if platform not in UPLOAD_CONNECTORS:
        return JSONResponse(status_code=400, content={
            "error": f"Upload not supported for '{platform}'. Supported: {sorted(UPLOAD_CONNECTORS)}"})

    namespace = user["id"]
    suffix = Path(file.filename or "upload.json").suffix.lower() or ".json"
    tmp_path = None      # the raw uploaded file (.json or .zip)
    parse_path = None    # the JSON path actually handed to the connector
    try:
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as fh:
            fh.write(contents)
            tmp_path = fh.name
        # A real ChatGPT/Claude/Telegram export is a .zip; pull the inner JSON out.
        if suffix == ".zip":
            parse_path = _extract_export_from_zip(tmp_path, platform)
        else:
            parse_path = tmp_path
        count = await run_in_threadpool(run_connector, platform, namespace, source_path=parse_path)
    except zipfile.BadZipFile:
        return JSONResponse(status_code=422, content={"error": "Uploaded file is not a valid .zip archive"})
    except json.JSONDecodeError:
        return JSONResponse(status_code=422, content={"error": "Uploaded file is not valid JSON"})
    except ValueError as e:
        return JSONResponse(status_code=422, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})
    finally:
        for p in {tmp_path, parse_path}:
            if p and os.path.exists(p):
                os.unlink(p)

    return {"platform": platform, "ingested": count, "namespace": namespace}


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "UnifiedMemory local MCP server",
            "signing": _SIGNING_OK, "ingest": _INGEST_OK}
