# ingestion/connectors/instagram.py
# Instagram requires DSAR — request from: Settings > Account > Download your information
import zipfile, json, os
from datetime import datetime
from ingestion.synthesis import RawMemory

class InstagramConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, archive_zip=None):
        if not archive_zip: return []
        memories = []
        with zipfile.ZipFile(archive_zip, 'r') as z:
            for name in z.namelist():
                if 'liked_posts' in name or 'post_1' in name:
                    try:
                        with z.open(name) as f:
                            data = json.load(f)
                            for item in (data if isinstance(data, list) else []):
                                caption = ''
                                if isinstance(item, dict):
                                    media = item.get('media', [{}])
                                    caption = media[0].get('title', '') if media else ''
                                    ts = datetime.fromtimestamp(media[0].get('creation_timestamp', 0)) if media else datetime.now()
                                    if caption:
                                        memories.append(RawMemory(
                                            content=f"Instagram post: {caption[:300]}",
                                            timestamp=ts, source='instagram'))
                    except: continue
        return memories

    def get_export_instructions(self):
        return {'url': 'https://accountscenter.instagram.com/info_and_permissions/dyi/',
                'steps': '1. Account Center > Your information > Download your information  2. Select JSON format  3. Upload zip here'}
