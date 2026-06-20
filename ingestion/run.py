#!/usr/bin/env python3
# ingestion/run.py — unified connector runner.
#
# Drives any connector end-to-end:  authenticate -> fetch_data -> synthesize_batch
# (classify + embed + upsert into the Pinecone namespace == user_id/token_id).
#
# CLI:
#   uv run python -m ingestion.run github   --user 0
#   uv run python -m ingestion.run chatgpt  --user 0 --file conversations.json
#   uv run python -m ingestion.run gmail    --user 0 --credentials credentials.json

import argparse
import sys

from ingestion.connectors import CONNECTORS, get_connector
from ingestion.synthesis import synthesize_batch


def run_connector(platform, user_id, source_path=None, auth_kwargs=None, fetch_kwargs=None) -> int:
    """Run one connector and synthesize its memories into namespace `user_id`.

    - source_path: file path for tier-2/3 export parsers; routed into the
      connector's declared fetch kwarg (e.g. chatgpt -> export_file).
    - auth_kwargs / fetch_kwargs: passed through to authenticate() / fetch_data().

    Returns the number of memories upserted.
    """
    spec = CONNECTORS[platform]  # KeyError (clear message) on unknown platform
    conn = get_connector(platform)
    conn.authenticate(**(auth_kwargs or {}))

    fk = dict(fetch_kwargs or {})
    if source_path and spec.fetch_arg:
        fk[spec.fetch_arg] = source_path

    memories = conn.fetch_data(**fk)
    return synthesize_batch(memories, user_id)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Run a UnifiedMemory connector.")
    parser.add_argument("platform", choices=sorted(CONNECTORS), help="connector to run")
    parser.add_argument("--user", required=True, help="user_id / consent token_id (Pinecone namespace)")
    parser.add_argument("--file", dest="source_path", help="export file path (tier-2/3 connectors)")
    parser.add_argument("--credentials", help="OAuth credentials file (gmail / google_fit)")
    args = parser.parse_args(argv)

    auth_kwargs = {"credentials_file": args.credentials} if args.credentials else None

    print(f"▶  Running '{args.platform}' connector → namespace '{args.user}'...")
    try:
        count = run_connector(
            args.platform, args.user,
            source_path=args.source_path, auth_kwargs=auth_kwargs,
        )
    except Exception as e:
        print(f"❌ {args.platform} failed: {type(e).__name__}: {e}")
        return 1
    print(f"✅ Synthesized {count} memories from {args.platform} into namespace '{args.user}'.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
