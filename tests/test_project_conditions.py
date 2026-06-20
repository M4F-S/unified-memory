"""
General project-condition sanity checks: connector SDKs are installed, the
RawMemory contract is intact, and pyproject declares the connector deps.
Cheap guards so a missing dep / interface drift fails loudly in CI.
"""
import importlib
import re
import sys
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parent.parent

# SDK import name -> the pyproject package that provides it
CONNECTOR_SDKS = {
    "googleapiclient":      "google-api-python-client",
    "google_auth_oauthlib": "google-auth-oauthlib",
    "spotipy":              "spotipy",
    "praw":                 "praw",
    "discord":              "discord.py",
    "slack_sdk":            "slack-sdk",
    "notion_client":        "notion-client",
    "github":               "PyGithub",
}


@pytest.mark.parametrize("module", sorted(CONNECTOR_SDKS))
def test_connector_sdk_importable(module):
    importlib.import_module(module)


def test_rawmemory_fields():
    from ingestion.synthesis import RawMemory
    fields = set(RawMemory.__dataclass_fields__)
    assert {"content", "timestamp", "source", "url", "metadata"} <= fields


def test_pyproject_declares_connector_deps():
    if sys.version_info >= (3, 11):
        import tomllib
        deps = tomllib.loads((REPO / "pyproject.toml").read_text("utf-8"))["project"]["dependencies"]
    else:  # pragma: no cover
        deps = re.findall(r'"([^"]+)"', (REPO / "pyproject.toml").read_text("utf-8"))
    declared = {re.split(r"[<>=!~ \[]", d, 1)[0].lower() for d in deps}
    expected = {pkg.lower() for pkg in CONNECTOR_SDKS.values()}
    assert expected <= declared, f"missing from pyproject: {expected - declared}"
