# ingestion/connectors/gmail.py
import os, base64
from datetime import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from ingestion.synthesis import RawMemory

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

class GmailConnector:
    def authenticate(self, credentials_file='credentials.json'):
        flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
        creds = flow.run_local_server(port=0)
        self.service = build('gmail', 'v1', credentials=creds)
        return True

    def fetch_data(self, max_results=500):
        memories = []
        results = self.service.users().messages().list(userId='me', maxResults=max_results).execute()
        for msg in results.get('messages', []):
            try:
                full = self.service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                headers = {h['name']: h['value'] for h in full['payload'].get('headers', [])}
                subject = headers.get('Subject', '(no subject)')
                sender = headers.get('From', 'unknown')
                body = self._extract_body(full['payload'])
                ts = datetime.fromtimestamp(int(full['internalDate']) / 1000)
                memories.append(RawMemory(
                    content=f"Email from {sender}: {subject} — {body[:300]}",
                    timestamp=ts, source='gmail',
                    metadata={'subject': subject, 'from': sender}))
            except: continue
        return memories

    def _extract_body(self, payload):
        if 'body' in payload and payload['body'].get('data'):
            return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')[:300]
        for part in payload.get('parts', []):
            if part['mimeType'] == 'text/plain' and part['body'].get('data'):
                return base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')[:300]
        return ''
