# ingestion/connectors/facebook.py
# Facebook requires DSAR export — Settings > Your Facebook Information > Download Your Information
import zipfile, json
from datetime import datetime
from ingestion.synthesis import RawMemory

class FacebookConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, archive_zip=None):
        if not archive_zip: return []
        memories = []
        with zipfile.ZipFile(archive_zip, 'r') as z:
            for name in z.namelist():
                if 'posts/your_posts' in name and name.endswith('.json'):
                    with z.open(name) as f:
                        posts = json.load(f)
                        for post in (posts if isinstance(posts, list) else []):
                            data = post.get('data', [{}])
                            text = data[0].get('post', '') if data else ''
                            ts = datetime.fromtimestamp(post.get('timestamp', 0))
                            if text:
                                memories.append(RawMemory(
                                    content=f"Facebook post: {text[:300]}",
                                    timestamp=ts, source='facebook'))
        return memories

    def get_export_instructions(self):
        return {'url': 'https://www.facebook.com/dyi/?referrer=yfi_settings',
                'steps': '1. Settings > Your Facebook Information > Download  2. Select JSON format  3. Upload zip here'}
