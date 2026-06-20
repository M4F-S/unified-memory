# demo/near_consent.py — thin near-cli wrapper for the live revocation demo.
# Mints / revokes Consent NFTs on NEAR testnet so the "wow moment" is REAL
# (a genuine on-chain transaction the judges can open in the explorer), not a
# hard-coded print.
#
# Gotcha baked in: rpc.testnet.near.org is dead. near-cli v4 reads the RPC
# override from the env var NEAR_TESTNET_RPC — we force FastNEAR for every call.

import os, re, json, subprocess
from dotenv import load_dotenv

load_dotenv()

CONTRACT = os.getenv("NEAR_CONTRACT_ID", "aihackathon.testnet")
SIGNER   = os.getenv("NEAR_ACCOUNT_ID", CONTRACT)
FAST_RPC = os.getenv("NEAR_RPC", "https://rpc.testnet.fastnear.com")
EXPLORER = "https://testnet.nearblocks.io/txns"

# Full demo scope — every platform + memory type, generous limits.
_DEMO_SCOPE = {
    "agent_id": "demo-agent.testnet",
    "allowed_platforms": [
        "gmail", "github", "spotify", "chatgpt", "slack", "discord", "notion",
        "apple_health", "twitter", "whatsapp", "youtube", "reddit", "telegram",
        "instagram", "linkedin",
    ],
    "allowed_memory_types": ["episodic", "semantic", "procedural", "social", "preferential"],
    "max_queries": 100,
    "max_usdc_budget": 1.0,
    "expires_at": "9999999999999",
    "data_root_hash": "0x" + "0" * 64,
}


class NearError(RuntimeError):
    """Raised when a near-cli command fails or its output can't be parsed."""


def _run(args, timeout=90):
    env = {**os.environ, "NEAR_TESTNET_RPC": FAST_RPC}
    try:
        proc = subprocess.run(
            ["near", *args],
            capture_output=True, text=True, timeout=timeout, env=env,
        )
    except FileNotFoundError as e:
        raise NearError("near-cli not found on PATH (npm install -g near-cli)") from e
    except subprocess.TimeoutExpired as e:
        raise NearError(f"near-cli timed out after {timeout}s") from e
    out = (proc.stdout or "") + "\n" + (proc.stderr or "")
    if proc.returncode != 0:
        raise NearError(out.strip()[-600:])
    return out


def mint_demo_consent(agent_id=None):
    """Mint a fresh, ephemeral consent token for one demo run. Returns token_id (str).

    A new token id is required because revoke_consent is irreversible — reusing a
    revoked token would fail every future rehearsal.
    """
    scope = dict(_DEMO_SCOPE)
    if agent_id:
        scope["agent_id"] = agent_id
    out = _run([
        "call", CONTRACT, "mint_consent", json.dumps(scope),
        "--accountId", SIGNER, "--deposit", "0.1",
    ])
    # Most reliable: the contract log `ConsentNFT minted: tokenId=N`.
    m = re.search(r"tokenId=(\d+)", out)
    if m:
        return m.group(1)
    # Fallback: the bare return value near-cli echoes on the last line, e.g. '3'.
    last = out.strip().splitlines()[-1] if out.strip() else ""
    m = re.search(r"^'?(\d+)'?$", last.strip())
    if m:
        return m.group(1)
    raise NearError(f"Could not parse token_id from mint output:\n...{out[-400:]}")


def revoke_consent(token_id):
    """Revoke a consent token on-chain. Returns (tx_hash, explorer_url).

    tx_hash may be None if near-cli changes its output format, but the revoke
    itself still succeeded (non-zero exit would have raised).
    """
    out = _run([
        "call", CONTRACT, "revoke_consent",
        json.dumps({"token_id": str(token_id)}),
        "--accountId", SIGNER,
    ])
    m = re.search(r"Transaction Id\s+([A-Za-z0-9]+)", out)
    tx = m.group(1) if m else None
    return tx, (f"{EXPLORER}/{tx}" if tx else None)


def validate_query(token_id, platform="all", memory_type="all", cost=0.001):
    """View call — returns the contract's {valid, reason|remaining_queries} dict."""
    out = _run([
        "view", CONTRACT, "validate_query",
        json.dumps({
            "token_id": str(token_id), "platform": platform,
            "memory_type": memory_type, "query_cost_usdc": cost,
        }),
    ])
    # near-cli echoes the args first ("View call: ...({...})") then prints the
    # result as a JS-style object with unquoted keys: { valid: true, ... }.
    # Take the LAST {...} block (the result) and coerce it into valid JSON.
    blocks = re.findall(r"(\{[^{}]*\})", out.replace("\n", " "))
    if blocks:
        blob = blocks[-1]
        blob = re.sub(r"([{,]\s*)([A-Za-z_]\w*)\s*:", r'\1"\2":', blob)  # quote keys
        blob = blob.replace("'", '"')
        try:
            return json.loads(blob)
        except json.JSONDecodeError:
            pass
    raise NearError(f"Could not parse validate_query output:\n...{out[-300:]}")
