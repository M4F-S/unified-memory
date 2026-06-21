# ingestion/connectors/google_fit.py
import os
from datetime import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from ingestion.synthesis import RawMemory

SCOPES = ['https://www.googleapis.com/auth/fitness.activity.read',
          'https://www.googleapis.com/auth/fitness.sleep.read']

class GoogleFitConnector:
    def authenticate(self, credentials_file='credentials.json'):
        flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
        creds = flow.run_local_server(port=0)
        self.service = build('fitness', 'v1', credentials=creds)
        return True

    def fetch_data(self):
        import time
        now_ms = int(time.time() * 1000)
        start_ms = now_ms - 90 * 24 * 3600 * 1000  # 90 days
        memories = []
        try:
            resp = self.service.users().dataset().aggregate(userId='me', body={
                'aggregateBy': [{'dataTypeName': 'com.google.step_count.delta'}],
                'bucketByTime': {'durationMillis': 86400000},
                'startTimeMillis': start_ms, 'endTimeMillis': now_ms
            }).execute()
            for bucket in resp.get('bucket', []):
                ts = datetime.fromtimestamp(int(bucket['startTimeMillis']) / 1000)
                for ds in bucket.get('dataset', []):
                    for point in ds.get('point', []):
                        steps = sum(v.get('intVal', 0) for v in point.get('value', []))
                        if steps > 0:
                            memories.append(RawMemory(
                                content=f"Google Fit: {steps} steps on {ts.strftime('%Y-%m-%d')}",
                                timestamp=ts, source='google_fit'))
        except: pass
        return memories
