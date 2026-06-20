#!/usr/bin/env python3
# demo/reset_consent.py — prepare a fresh, repeatable demo run (do this OFF-STAGE).
#
# Because revoke_consent is irreversible, every rehearsal needs a brand-new token.
# This script:
#   1. mints a fresh Consent NFT on NEAR  -> new token_id
#   2. seeds that token's Pinecone namespace with the 30 demo memories
#   3. writes DEMO_CONSENT_TOKEN=<new id> back into .env
#
# After it finishes, `python demo/agent.py` runs A–C on the fresh token and does a
# REAL on-chain revoke before D. Run this between rehearsals; it takes ~15–20s
# (mostly embedding the demo memories).
#
# Usage:  uv run python demo/reset_consent.py

import os, re, sys
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from demo.near_consent import mint_demo_consent, validate_query, NearError
from ingestion.synthesis import load_demo_memories

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def _update_env_token(token_id):
    """Set DEMO_CONSENT_TOKEN=<token_id> in .env, preserving everything else."""
    lines = ENV_PATH.read_text().splitlines() if ENV_PATH.exists() else []
    found = False
    for i, line in enumerate(lines):
        if re.match(r"\s*DEMO_CONSENT_TOKEN\s*=", line):
            lines[i] = f"DEMO_CONSENT_TOKEN={token_id}"
            found = True
            break
    if not found:
        lines.append(f"DEMO_CONSENT_TOKEN={token_id}")
    ENV_PATH.write_text("\n".join(lines) + "\n")


def main():
    load_dotenv()
    print("🪙  Minting a fresh Consent NFT on NEAR testnet...")
    try:
        token_id = mint_demo_consent()
    except NearError as e:
        print(f"❌ Mint failed:\n{e}")
        sys.exit(1)
    print(f"   ✅ Minted token_id = {token_id}")

    print(f"\n🧠  Seeding Pinecone namespace '{token_id}' with demo memories...")
    count = load_demo_memories(token_id)  # namespace == token_id
    print(f"   ✅ Seeded {count} memories")

    print("\n🔎  Verifying consent is active on-chain...")
    try:
        res = validate_query(token_id)
        print(f"   ✅ validate_query -> {res}")
    except NearError as e:
        print(f"   ⚠️  Could not verify (non-fatal): {e}")

    _update_env_token(token_id)
    print(f"\n✅ Ready. .env now has DEMO_CONSENT_TOKEN={token_id}")
    print("   Next: uv run python demo/agent.py")


if __name__ == "__main__":
    main()
