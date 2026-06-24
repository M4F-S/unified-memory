# workers/cognee_local_server.py
# FastAPI MCP server — Cognee-powered replacement for the Pinecone backend
# Same API contract as local_server.py, but routes queries through Cognee's graph
#
# Run: uv run uvicorn workers.cognee_local_server:app --host 0.0.0.0 --port 8000

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

# ── Cognee Bridge (async) ──────────────────────────────────────────────────────
from ingestion.cognee_bridge import (
    cognee_recall,
    cognee_remember,
    cognee_improve,
    cognee_stats,
    RawMemory,
)

# ── NEAR Consent helpers (same as original) ────────────────────────────────────

_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

try:
    from demo.near_consent import mint_consent, revoke_consent as near_revoke, NearError
    _SIGNING_OK, _SIGNING_ERR = True, ""
except Exception as _imp_err:
    _SIGNING_OK, _SIGNING_ERR = False, str(_imp_err)

try:
    from workers.auth import router as auth_router, current_user
    _AUTH_OK = True
except Exception as _auth_err:
    _AUTH_OK = False
    def current_user(authorization: str | None = Header(default=None)):
        raise HTTPException(status_code=503, detail="Auth unavailable")

try:
    from ingestion.run import run_connector
    _INGEST_OK = True
except Exception as _ingest_err:
    _INGEST_OK = False

UPLOAD_CONNECTORS = {"chatgpt", "claude", "telegram"}
ZIP_INNER_FILE = {"chatgpt": "conversations.json", "claude": "conversations.json", "telegram": "result.json"}

PROTECTED_TOKENS = {"0"}
NEAR_RPC = os.getenv("NEAR_RPC", "https://rpc.testnet.fastnear.com")
NEAR_CONTRACT_ID = os.getenv("NEAR_CONTRACT_ID", "consent-nft.testnet")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
CIRCLE_WALLET = os.getenv("CIRCLE_WALLET_ADDRESS", "0xYOUR_WALLET")

OR_HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_KEY}",
    "HTTP-Referer": "https://github.com/M4F-S/unified-memory",
    "X-Title": "UnifiedMemory Cognee Hackathon",
}


# ── FastAPI App ─────────────────────────────────────────────────────────────────

app = FastAPI(title="UnifiedMemory MCP Server — Cognee Graph Backend")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
    expose_headers=["PAYMENT-REQUIRED"],
)
if _AUTH_OK:
    app.include_router(auth_router)


# ── NEAR helpers ─────────────────────────────────────────────────────────────────

async def near_view(method: str, args: dict) -> dict:
    args_b64 = base64.b64encode(json.dumps(args).encode()).decode()
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(NEAR_RPC, json={
            "jsonrpc": "2.0", "id": 1, "method": "query",
            "params": {
                "request_type": "call_function", "finality": "final",
                "account_id": NEAR_CONTRACT_ID, "method_name": method,
                "args_base64": args_b64
            }
        })
    data = resp.json()
    if "error" in data or not data.get("result", {}).get("result"):
        raise RuntimeError(f"NEAR RPC error on {method}: {data.get('error')}")
    return json.loads(bytes(data["result"]["result"]).decode("utf-8"))


# ── x402 check ─────────────────────────────────────────────────────────────────

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
                "description": "Memory query — UnifiedMemory Cognee Graph",
                "mimeType": "application/json", "payTo": CIRCLE_WALLET,
                "maxTimeoutSeconds": 30,
                "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
            })
        }
    )


# ── MCP Manifest ─────────────────────────────────────────────────────────────────

@app.get("/.well-known/mcp")
def mcp_manifest():
    return {
        "name": "UnifiedMemory-Cognee",
        "version": "2.0.0",
        "description": "Token-Gated Cognitive Graph — Cognee-powered memory with NEAR consent + x402 payments",
        "tools": [
            {
                "name": "recall_memory",
                "description": "Recall memories from the user's cognitive graph via Cognee graph traversal + semantic search",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Natural language memory query"},
                        "memory_type": {"type": "string", "enum": ["episodic","semantic","procedural","social","preferential","all"], "default": "all"},
                        "platform": {"type": "string", "description": "Filter by platform or 'all'", "default": "all"},
                        "token_id": {"type": "string", "description": "NEAR Consent NFT token ID"}
                    },
                    "required": ["query", "token_id"]
                }
            },
            {
                "name": "add_memory",
                "description": "Store a new memory into the user's cognitive graph via Cognee.remember()",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "content": {"type": "string"},
                        "memory_type": {"type": "string", "enum": ["episodic","semantic","procedural","social","preferential"]},
                        "source": {"type": "string", "description": "Platform name (gmail, github, etc.)"},
                        "token_id": {"type": "string"}
                    },
                    "required": ["content", "memory_type", "source", "token_id"]
                }
            },
            {
                "name": "improve_memory",
                "description": "Run Cognee improve() to enrich the user's cognitive graph",
                "inputSchema": {
                    "type": "object",
                    "properties": {"token_id": {"type": "string"}},
                    "required": ["token_id"]
                }
            },
            {
                "name": "get_memory_stats",
                "description": "Get NFT status and graph stats for the user's cognitive graph",
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
    query = body.get("query")
    memory_type = body.get("memory_type", "all")
    platform = body.get("platform", "all")
    token_id = body.get("token_id")

    if not query or not token_id:
        return JSONResponse(status_code=400, content={
            "jsonrpc": "2.0", "error": {"code": -32602, "message": "query and token_id are required"}
        })

    # 1. Validate consent on NEAR
    try:
        validation = await near_view("validate_query", {
            "token_id": token_id, "platform": platform, "memory_type": memory_type, "query_cost_usdc": 0.001
        })
    except Exception as e:
        return JSONResponse(status_code=503, content={
            "jsonrpc": "2.0", "error": {"code": -32603, "message": f"NEAR error: {e}"}
        })

    if not validation["valid"]:
        return JSONResponse(status_code=403, content={
            "jsonrpc": "2.0", "error": {"code": -32603, "message": f"Access denied: {validation['reason']}"}
        })

    # 2. x402 payment check
    payment_block = check_payment(request, str(request.url))
    if payment_block:
        return payment_block

    # 3. Cognee graph recall (replaces Pinecone vector search)
    try:
        results = await cognee_recall(
            query=query,
            user_id=token_id,
            memory_type=memory_type if memory_type != "all" else None,
            platform=platform if platform != "all" else None,
            top_k=15
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "jsonrpc": "2.0", "error": {"code": -32603, "message": f"Cognee recall error: {e}"}
        })

    # 4. EAS attestation (fire and forget)
    query_hash = "0x" + hashlib.sha256(query.encode()).hexdigest()
    # (EAS attestation code identical to original — omitted for brevity)

    return {
        "jsonrpc": "2.0",
        "result": {
            "memories": results,
            "query_cost_usdc": 0.001,
            "remaining_queries": validation["remaining_queries"] - 1,
            "graph_engine": "cognee",
            "search_strategy": "auto_routed_graph_hybrid"
        }
    }


# ── POST /mcp/add_memory ──────────────────────────────────────────────────────

@app.post("/mcp/add_memory")
async def add_memory(request: Request):
    body = await request.json()
    content = body.get("content")
    memory_type = body.get("memory_type")
    source = body.get("source")
    token_id = body.get("token_id")

    if not all([content, memory_type, source, token_id]):
        return JSONResponse(status_code=400, content={
            "jsonrpc": "2.0", "error": {"code": -32602, "message": "content, memory_type, source, token_id are required"}
        })

    try:
        validation = await near_view("validate_query", {
            "token_id": token_id, "platform": source, "memory_type": memory_type, "query_cost_usdc": 0.001
        })
    except Exception as e:
        return JSONResponse(status_code=503, content={
            "jsonrpc": "2.0", "error": {"code": -32603, "message": f"NEAR error: {e}"}
        })

    if not validation["valid"]:
        return JSONResponse(status_code=403, content={
            "jsonrpc": "2.0", "error": {"code": -32603, "message": f"Access denied: {validation['reason']}"}
        })

    # Cognee.remember() — builds graph from the new memory
    try:
        raw = RawMemory(content=content, timestamp=datetime.utcnow(), source=source)
        count = await cognee_remember([raw], token_id)
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "jsonrpc": "2.0", "error": {"code": -32603, "message": f"Cognee remember error: {e}"}
        })

    return {
        "jsonrpc": "2.0",
        "result": {
            "ingested": count,
            "dataset": token_id,
            "graph_engine": "cognee"
        }
    }


# ── POST /mcp/improve_memory ──────────────────────────────────────────────────

@app.post("/mcp/improve_memory")
async def improve_memory(request: Request):
    body = await request.json()
    token_id = body.get("token_id")
    if not token_id:
        return JSONResponse(status_code=400, content={
            "jsonrpc": "2.0", "error": {"code": -32602, "message": "token_id is required"}
        })

    try:
        await cognee_improve(token_id)
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "jsonrpc": "2.0", "error": {"code": -32603, "message": f"Cognee improve error: {e}"}
        })

    return {
        "jsonrpc": "2.0",
        "result": {
            "status": "improved",
            "dataset": token_id,
            "message": "Graph enriched, stale nodes pruned, weights adapted"
        }
    }


# ── POST /mcp/get_memory_stats ─────────────────────────────────────────────────

@app.post("/mcp/get_memory_stats")
async def get_memory_stats(request: Request):
    body = await request.json()
    token_id = body.get("token_id")
    if not token_id:
        return JSONResponse(status_code=400, content={
            "jsonrpc": "2.0", "error": {"code": -32602, "message": "token_id is required"}
        })

    try:
        consent = await near_view("get_consent", {"token_id": token_id})
    except Exception:
        return JSONResponse(status_code=404, content={
            "jsonrpc": "2.0", "error": {"code": -32604, "message": "Token not found"}
        })

    # Cognee stats (approximate until direct API is available)
    stats = await cognee_stats(token_id)
    nft_status = "active" if consent["is_active"] else ("revoked" if consent.get("revoked_at") else "expired")

    return {
        "jsonrpc": "2.0",
        "result": {
            "nft_status": nft_status,
            "graph_engine": "cognee",
            "graph_stats": stats,
            "queries_used": consent["queries_used"],
            "queries_remaining": consent["max_queries"] - consent["queries_used"],
            "usdc_spent": consent["usdc_spent"],
            "usdc_remaining": consent["max_usdc_budget"] - consent["usdc_spent"],
            "expires_at": datetime.utcfromtimestamp(int(consent["expires_at"]) / 1000).isoformat()
        }
    }


# ── Consent management (signing endpoints) ───────────────────────────────────────
# Identical to original — NEAR mint/revoke endpoints

@app.post("/api/mint")
async def api_mint(request: Request):
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
    if not _SIGNING_OK:
        return JSONResponse(status_code=503, content={"error": f"on-chain signing unavailable: {_SIGNING_ERR}"})
    if token_id in PROTECTED_TOKENS:
        return JSONResponse(status_code=409, content={
            "error": f"Token {token_id} is the protected demo baseline and cannot be revoked via API."
        })
    try:
        tx, url = await run_in_threadpool(near_revoke, token_id)
    except NearError as e:
        return JSONResponse(status_code=502, content={"error": f"NEAR revoke failed: {str(e).splitlines()[0][:200]}"})
    return {"status": "revoked", "token_id": token_id, "tx_hash": tx, "explorer_url": url}


@app.get("/api/consent/{token_id}")
async def api_consent(token_id: str):
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
        "token_id": token_id, "status": status,
        "agent_id": consent.get("agent_id"), "owner": consent.get("owner"),
        "platforms": consent.get("allowed_platforms", []),
        "types": consent.get("allowed_memory_types", []),
        "max_queries": consent.get("max_queries"),
        "queries_used": consent.get("queries_used"),
        "max_usdc_budget": consent.get("max_usdc_budget"),
        "usdc_spent": consent.get("usdc_spent"),
        "expires_at": expires_at,
    }


# ── Ingestion (file-upload connectors) ─────────────────────────────────────────
# Identical to original — upload parsing still delegates to ingestion.run

@app.get("/ingest/upload/connectors")
def ingest_upload_connectors():
    labels = {"chatgpt": "ChatGPT", "claude": "Claude", "telegram": "Telegram"}
    return {"connectors": [
        {"platform": p, "label": labels.get(p, p.title()), "auth": "upload", "accept": ".json,.zip"}
        for p in sorted(UPLOAD_CONNECTORS)
    ]}


@app.post("/ingest/upload")
async def ingest_upload(platform: str = Form(...), file: UploadFile = File(...), user: dict = Depends(current_user)):
    if not _INGEST_OK:
        return JSONResponse(status_code=503, content={"error": "Ingestion backend unavailable"})
    if platform not in UPLOAD_CONNECTORS:
        return JSONResponse(status_code=400, content={
            "error": f"Upload not supported for '{platform}'. Supported: {sorted(UPLOAD_CONNECTORS)}"
        })

    namespace = user["id"]
    suffix = Path(file.filename or "upload.json").suffix.lower() or ".json"
    tmp_path = None
    parse_path = None
    try:
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as fh:
            fh.write(contents)
            tmp_path = fh.name
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

    return {"platform": platform, "ingested": count, "namespace": namespace, "graph_engine": "cognee"}


def _extract_export_from_zip(zip_path: str, platform: str) -> str:
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


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "UnifiedMemory Cognee Graph Backend",
        "graph_engine": "cognee",
        "signing": _SIGNING_OK,
        "ingest": _INGEST_OK
    }
