# ingestion/connectors/telegram.py
# Parses Telegram export (result.json) — export from Telegram Desktop > Settings > Export
import json
from datetime import datetime
from ingestion.synthesis import RawMemory

class TelegramConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, export_file='result.json'):
        memories = []
        with open(export_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for chat in data.get('chats', {}).get('list', []):
            chat_name = chat.get('name', 'Unknown')
            for msg in chat.get('messages', []):
                if msg.get('type') == 'message' and isinstance(msg.get('text'), str) and msg['text']:
                    try:
                        ts = datetime.fromisoformat(msg['date'])
                        memories.append(RawMemory(
                            content=f"Telegram in {chat_name}: {msg['text'][:300]}",
                            timestamp=ts, source='telegram',
                            metadata={'chat': chat_name, 'from': msg.get('from', '')}))
                    except: continue
        return memories
