# ingestion/connectors/apple_mail.py
# Parses Apple Mail mbox export from Google Takeout or direct Mail export
import mailbox
from datetime import datetime
from email.header import decode_header
from ingestion.synthesis import RawMemory

class AppleMailConnector:
    def authenticate(self, **kwargs): return True

    def _decode_header(self, value):
        if not value: return ''
        decoded, encoding = decode_header(value)[0]
        if isinstance(decoded, bytes):
            return decoded.decode(encoding or 'utf-8', errors='ignore')
        return str(decoded)

    def fetch_data(self, mbox_file='mail.mbox'):
        memories = []
        mbox = mailbox.mbox(mbox_file)
        for msg in mbox:
            subject = self._decode_header(msg.get('Subject', ''))
            sender = self._decode_header(msg.get('From', ''))
            date_str = msg.get('Date', '')
            try:
                from email.utils import parsedate_to_datetime
                ts = parsedate_to_datetime(date_str)
            except: ts = datetime.now()
            if subject:
                memories.append(RawMemory(
                    content=f"Email from {sender}: {subject}",
                    timestamp=ts, source='apple_mail'))
        return memories
