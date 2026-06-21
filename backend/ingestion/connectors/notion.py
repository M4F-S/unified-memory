# ingestion/connectors/notion.py
import os
from datetime import datetime
from notion_client import Client
from ingestion.synthesis import RawMemory

class NotionConnector:
    def authenticate(self):
        self.client = Client(auth=os.getenv('NOTION_API_KEY'))
        return True

    def fetch_data(self):
        memories = []
        pages = self.client.search(filter={'property':'object','value':'page'}).get('results', [])
        for page in pages:
            try:
                ts = datetime.fromisoformat(page['created_time'].replace('Z','+00:00'))
                title = ''
                for prop in page.get('properties', {}).values():
                    if prop.get('type') == 'title' and prop['title']:
                        title = prop['title'][0].get('plain_text', '')
                        break
                if title:
                    memories.append(RawMemory(
                        content=f"Notion page: {title}",
                        timestamp=ts, source='notion', url=page.get('url','')))
            except: continue
        return memories
