# ingestion/connectors/slack.py
import os
from datetime import datetime
from slack_sdk import WebClient
from ingestion.synthesis import RawMemory

class SlackConnector:
    def authenticate(self):
        self.client = WebClient(token=os.getenv('SLACK_BOT_TOKEN'))
        return True

    def fetch_data(self, max_channels=10, max_messages=200):
        memories = []
        channels = self.client.conversations_list(types='public_channel,private_channel').get('channels', [])
        for ch in channels[:max_channels]:
            try:
                history = self.client.conversations_history(channel=ch['id'], limit=max_messages)
                for msg in history.get('messages', []):
                    if msg.get('text') and not msg.get('bot_id'):
                        ts = datetime.fromtimestamp(float(msg['ts']))
                        memories.append(RawMemory(
                            content=f"Slack in #{ch['name']}: {msg['text'][:300]}",
                            timestamp=ts, source='slack',
                            metadata={'channel': ch['name']}))
            except: continue
        return memories
