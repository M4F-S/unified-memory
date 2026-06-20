# ingestion/connectors/__init__.py
# Connector registry + lazy loader.
#
# Maps a platform name -> its connector class and metadata. Connector modules
# pull in heavy SDKs (googleapiclient, spotipy, praw, discord.py, ...), so this
# module imports NONE of them at import time — the metadata below is pure data,
# and get_connector() imports the target module lazily only when actually needed.
#
# Mirrors the platform list in workers/ingest.js (CONNECTORS). Note: telegram is
# tagged api_key/tier-1 there but is implemented in Python as a result.json export
# parser — this registry reflects the real (export) shape.

import importlib
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class ConnectorSpec:
    platform: str
    module: str          # dotted module path under this package
    class_name: str
    auth: str            # "oauth2" | "api_key" | "upload" | "dsar"
    tier: int            # 1 = connect (API), 2 = upload, 3 = DSAR
    label: str
    fetch_arg: Optional[str] = None  # the file kwarg fetch_data() expects (parsers only)


_SPECS = [
    # ── Tier 1: API / OAuth (credentials read from env or an OAuth file) ──────
    ConnectorSpec("gmail",        "gmail",        "GmailConnector",      "oauth2",  1, "Gmail"),
    ConnectorSpec("github",       "github",       "GitHubConnector",     "api_key", 1, "GitHub"),
    ConnectorSpec("spotify",      "spotify",      "SpotifyConnector",    "oauth2",  1, "Spotify"),
    ConnectorSpec("notion",       "notion",       "NotionConnector",     "api_key", 1, "Notion"),
    ConnectorSpec("slack",        "slack",        "SlackConnector",      "api_key", 1, "Slack"),
    ConnectorSpec("discord",      "discord",      "DiscordConnector",    "api_key", 1, "Discord"),
    ConnectorSpec("reddit",       "reddit",       "RedditConnector",     "oauth2",  1, "Reddit"),
    ConnectorSpec("google_fit",   "google_fit",   "GoogleFitConnector",  "oauth2",  1, "Google Fit"),
    # ── Tier 2: export-file parsers ──────────────────────────────────────────
    ConnectorSpec("chatgpt",      "chatgpt",      "ChatGPTConnector",    "upload",  2, "ChatGPT",      "export_file"),
    ConnectorSpec("claude",       "claude",       "ClaudeConnector",     "upload",  2, "Claude",       "export_file"),
    ConnectorSpec("telegram",     "telegram",     "TelegramConnector",   "upload",  2, "Telegram",     "export_file"),
    ConnectorSpec("apple_health", "apple_health", "AppleHealthConnector","upload",  2, "Apple Health", "export_file"),
    ConnectorSpec("whatsapp",     "whatsapp",     "WhatsAppConnector",   "upload",  2, "WhatsApp",     "chat_file"),
    ConnectorSpec("apple_mail",   "apple_mail",   "AppleMailConnector",  "upload",  2, "Apple Mail",   "mbox_file"),
    ConnectorSpec("youtube",      "youtube",      "YouTubeConnector",    "upload",  2, "YouTube",      "history_file"),
    # ── Tier 3: DSAR archive parsers ─────────────────────────────────────────
    ConnectorSpec("twitter",      "twitter",      "TwitterConnector",    "dsar",    3, "Twitter/X",    "archive_zip"),
    ConnectorSpec("linkedin",     "linkedin",     "LinkedInConnector",   "dsar",    3, "LinkedIn",     "archive_zip"),
    ConnectorSpec("instagram",    "instagram",    "InstagramConnector",  "dsar",    3, "Instagram",    "archive_zip"),
    ConnectorSpec("facebook",     "facebook",     "FacebookConnector",   "dsar",    3, "Facebook",     "archive_zip"),
    ConnectorSpec("tiktok",       "tiktok",       "TikTokConnector",     "dsar",    3, "TikTok",       "archive_zip"),
]

CONNECTORS = {spec.platform: spec for spec in _SPECS}


def get_connector(platform: str):
    """Instantiate the connector for `platform` (imports its module lazily)."""
    try:
        spec = CONNECTORS[platform]
    except KeyError:
        raise KeyError(
            f"Unknown connector '{platform}'. Known: {', '.join(sorted(CONNECTORS))}"
        )
    module = importlib.import_module(f"{__name__}.{spec.module}")
    return getattr(module, spec.class_name)()


def list_connectors():
    """Return connector metadata (no SDK imports) — for APIs/UI/tests."""
    return [
        {"platform": s.platform, "auth": s.auth, "tier": s.tier,
         "label": s.label, "fetch_arg": s.fetch_arg}
        for s in _SPECS
    ]
