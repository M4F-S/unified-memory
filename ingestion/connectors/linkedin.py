# ingestion/connectors/linkedin.py
# LinkedIn requires DSAR — no scraping API available
# Request export: Settings > Data Privacy > Get a copy of your data
import zipfile, csv, io
from datetime import datetime
from ingestion.synthesis import RawMemory

class LinkedInConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, archive_zip=None):
        if not archive_zip: return []
        memories = []
        with zipfile.ZipFile(archive_zip, 'r') as z:
            for name in z.namelist():
                if 'Connections' in name and name.endswith('.csv'):
                    with z.open(name) as f:
                        reader = csv.DictReader(io.TextIOWrapper(f))
                        for row in reader:
                            name_val = f"{row.get('First Name','')} {row.get('Last Name','')}".strip()
                            company = row.get('Company', '')
                            pos = row.get('Position', '')
                            if name_val:
                                memories.append(RawMemory(
                                    content=f"LinkedIn connection: {name_val}, {pos} at {company}",
                                    timestamp=datetime.now(), source='linkedin'))
                if 'Messages' in name and name.endswith('.csv'):
                    with z.open(name) as f:
                        reader = csv.DictReader(io.TextIOWrapper(f))
                        for row in reader:
                            content = row.get('CONTENT', '')
                            if content:
                                memories.append(RawMemory(
                                    content=f"LinkedIn message: {content[:300]}",
                                    timestamp=datetime.now(), source='linkedin'))
        return memories

    def get_export_instructions(self):
        return {'url': 'https://www.linkedin.com/settings/?modal=nsettings-privacy-data-sharing',
                'steps': '1. Settings > Data Privacy > Get a copy of your data  2. Select All  3. Request archive  4. Upload zip here'}
