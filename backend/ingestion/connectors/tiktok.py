# ingestion/connectors/tiktok.py
# TikTok requires DSAR — Settings > Privacy > Personalization and data > Download your data
import zipfile, json
from datetime import datetime
from ingestion.synthesis import RawMemory

class TikTokConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, archive_zip=None):
        if not archive_zip: return []
        memories = []
        with zipfile.ZipFile(archive_zip, 'r') as z:
            for name in z.namelist():
                if 'Video Browsing History' in name or 'Like List' in name:
                    try:
                        with z.open(name) as f:
                            data = json.load(f)
                            items = data.get('ItemFavoriteList', data.get('VideoList', []))
                            for item in items:
                                link = item.get('Link', '')
                                date = item.get('Date', '')
                                if link:
                                    memories.append(RawMemory(
                                        content=f"TikTok video watched/liked: {link}",
                                        timestamp=datetime.strptime(date[:19], '%Y-%m-%d %H:%M:%S') if date else datetime.now(),
                                        source='tiktok', url=link))
                    except: continue
        return memories

    def get_export_instructions(self):
        return {'url': 'https://www.tiktok.com/setting/?activeTab=data_and_privacy',
                'steps': '1. Settings > Privacy > Personalization and data > Download your data  2. Request JSON file  3. Upload here'}
