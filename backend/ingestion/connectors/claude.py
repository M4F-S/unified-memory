# ingestion/connectors/claude.py
# Parses Claude conversation export — download from Claude settings
import json
from datetime import datetime
from ingestion.synthesis import RawMemory

class ClaudeConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, export_file='claude_export.json'):
        memories = []
        with open(export_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        conversations = data if isinstance(data, list) else data.get('conversations', [])
        for convo in conversations:
            title = convo.get('name', 'Untitled')
            ts_str = convo.get('created_at', '')
            try: ts = datetime.fromisoformat(ts_str.replace('Z','+00:00'))
            except: ts = datetime.now()
            messages = convo.get('chat_messages', [])
            human_msgs = [m.get('text','') for m in messages if m.get('sender') == 'human']
            if human_msgs:
                content = f"Claude conversation '{title}': {' | '.join(human_msgs[:3])}"
                memories.append(RawMemory(content=content[:1000], timestamp=ts, source='claude'))
        return memories
