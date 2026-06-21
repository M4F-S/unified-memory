# ingestion/connectors/twitter.py
# Parses Twitter/X archive zip — request from Settings > Your Account > Download archive
import json, zipfile
from datetime import datetime
from ingestion.synthesis import RawMemory

class TwitterConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, archive_zip=None):
        if not archive_zip: return []
        memories = []
        with zipfile.ZipFile(archive_zip, 'r') as z:
            with z.open('data/tweets.js') as f:
                raw = f.read().decode('utf-8').replace('window.YTD.tweets.part0 = ', '')
                tweets = json.loads(raw)
                for item in tweets:
                    t = item.get('tweet', {})
                    text = t.get('full_text', '')
                    ts_str = t.get('created_at', '')
                    if text and ts_str and not text.startswith('RT '):
                        try:
                            ts = datetime.strptime(ts_str, '%a %b %d %H:%M:%S +0000 %Y')
                            memories.append(RawMemory(content=f"Tweet: {text}", timestamp=ts, source='twitter'))
                        except: continue
        return memories

    def get_export_instructions(self):
        return {'url': 'https://twitter.com/settings/download_your_data',
                'steps': '1. Settings > Your Account > Download archive  2. Wait for email  3. Upload tweets.js here'}
