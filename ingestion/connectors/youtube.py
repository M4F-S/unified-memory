# ingestion/connectors/youtube.py
# Parses YouTube watch history from Google Takeout (watch-history.json)
import json
from datetime import datetime
from ingestion.synthesis import RawMemory

class YouTubeConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, history_file='watch-history.json'):
        memories = []
        with open(history_file, 'r') as f:
            history = json.load(f)
        for item in history:
            if item.get('title') and item.get('time'):
                try:
                    ts = datetime.fromisoformat(item['time'].replace('Z','+00:00'))
                    channel = item.get('subtitles', [{}])[0].get('name', 'Unknown channel')
                    memories.append(RawMemory(
                        content=f"Watched YouTube: '{item['title']}' by {channel}",
                        timestamp=ts, source='youtube', url=item.get('titleUrl','')))
                except: continue
        return memories
