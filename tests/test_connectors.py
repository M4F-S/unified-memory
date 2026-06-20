"""
Tests for the connector registry + unified runner (ingestion/connectors, ingestion/run).
Connectors are validated by interface conformance, a couple of real parser fixtures,
and one mocked API connector — no network, no live credentials.
"""
import json
import re
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from ingestion.connectors import CONNECTORS, get_connector, list_connectors
from ingestion.synthesis import RawMemory

REPO = Path(__file__).resolve().parent.parent
CONNECTOR_DIR = REPO / "ingestion" / "connectors"


# ── Registry / drift guards ───────────────────────────────────────────────────

class TestRegistry:
    def test_platform_set_matches_modules(self):
        module_stems = {p.stem for p in CONNECTOR_DIR.glob("*.py") if p.stem != "__init__"}
        assert set(CONNECTORS) == module_stems

    def test_matches_js_platforms(self):
        js = (REPO / "workers" / "ingest.js").read_text()
        # only scan the CONNECTORS array, not the whole file
        block = js[js.index("const CONNECTORS"):js.index("];", js.index("const CONNECTORS"))]
        js_platforms = set(re.findall(r"platform:\s*'([^']+)'", block))
        assert js_platforms == set(CONNECTORS)

    def test_twenty_connectors(self):
        assert len(CONNECTORS) == 20
        assert len(list_connectors()) == 20


# ── Interface conformance (one function, 20 cases) ────────────────────────────

@pytest.mark.parametrize("platform", sorted(CONNECTORS))
def test_connector_conforms(platform):
    conn = get_connector(platform)  # imports the module lazily + instantiates
    assert callable(getattr(conn, "authenticate", None))
    assert callable(getattr(conn, "fetch_data", None))


# ── Export-file parsers (real logic, tiny fixtures) ───────────────────────────

class TestParsers:
    def test_chatgpt_parser(self, tmp_path):
        export = tmp_path / "conversations.json"
        export.write_text(json.dumps([{
            "title": "Hackathon planning",
            "create_time": 1_700_000_000,
            "mapping": {"a": {"message": {
                "author": {"role": "user"},
                "content": {"parts": ["how do I deploy a NEAR contract?"]},
            }}},
        }]))
        mems = get_connector("chatgpt").fetch_data(export_file=str(export))
        assert len(mems) == 1
        assert isinstance(mems[0], RawMemory)
        assert mems[0].source == "chatgpt"
        assert "NEAR" in mems[0].content

    def test_whatsapp_parser(self, tmp_path):
        chat = tmp_path / "_chat.txt"
        chat.write_text("12/25/23, 14:30 - Alice: Happy holidays!\n"
                        "12/25/23, 14:31 - Me: Thanks, you too\n")
        mems = get_connector("whatsapp").fetch_data(chat_file=str(chat), my_name="Me")
        assert len(mems) == 2
        assert all(m.source == "whatsapp" for m in mems)


# ── API connector (mocked SDK) ────────────────────────────────────────────────

class TestGitHubConnector:
    def test_maps_commits_to_memories(self):
        fake_commit = MagicMock()
        fake_commit.commit.message = "Add ConsentNFT contract"
        fake_commit.commit.author.date = datetime(2026, 6, 20)
        fake_commit.html_url = "https://github.com/x/y/commit/abc"
        fake_repo = MagicMock(); fake_repo.name = "unified-memory"
        fake_repo.get_commits.return_value = [fake_commit]
        fake_user = MagicMock(); fake_user.get_repos.return_value = [fake_repo]

        with patch("ingestion.connectors.github.Github") as MockGH:
            MockGH.return_value.get_user.return_value = fake_user
            conn = get_connector("github")
            conn.authenticate(token="fake-token")
            mems = conn.fetch_data(max_repos=5)

        assert len(mems) == 1
        assert mems[0].source == "github"
        assert "ConsentNFT" in mems[0].content


# ── Runner wiring (mocked, no network) ────────────────────────────────────────

class TestRunner:
    def test_routes_source_path_and_calls_pipeline(self):
        fake_conn = MagicMock()
        fake_conn.fetch_data.return_value = [RawMemory("c", datetime.now(), "chatgpt")]
        with patch("ingestion.run.get_connector", return_value=fake_conn), \
             patch("ingestion.run.synthesize_batch", return_value=1) as ms:
            from ingestion.run import run_connector
            n = run_connector("chatgpt", "ns-7", source_path="/tmp/conv.json")

        fake_conn.authenticate.assert_called_once()
        # chatgpt's declared fetch_arg is export_file → source_path routed there
        fake_conn.fetch_data.assert_called_once_with(export_file="/tmp/conv.json")
        ms.assert_called_once()
        assert ms.call_args.args[1] == "ns-7"   # synthesize_batch(memories, user_id)
        assert n == 1

    def test_unknown_platform_raises(self):
        from ingestion.run import run_connector
        with pytest.raises(KeyError):
            run_connector("myspace", "ns-7")
