# ingestion/connectors/chatgpt.py
# Parses ChatGPT conversation export — download from Settings > Data Controls > Export
import json
from datetime import datetime
from ingestion.synthesis import RawMemory

class ChatGPTConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, export_file='conversations.json'):
        memories = []
        with open(export_file, 'r', encoding='utf-8') as f:
            conversations = json.load(f)
        for convo in conversations:
            title = convo.get('title', 'Untitled')
            ts = datetime.fromtimestamp(convo.get('create_time', 0))
            messages = convo.get('mapping', {})
            user_msgs = [
                m['message']['content']['parts'][0]
                for m in messages.values()
                if m.get('message') and
                   m['message'].get('author', {}).get('role') == 'user' and
                   m['message'].get('content', {}).get('parts') and
                   isinstance(m['message']['content']['parts'][0], str)
            ]
            if user_msgs:
                content = f"ChatGPT conversation '{title}': {' | '.join(user_msgs[:3])}"
                memories.append(RawMemory(content=content[:1000], timestamp=ts, source='chatgpt'))
        return memories
