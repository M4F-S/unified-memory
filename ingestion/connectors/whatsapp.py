# ingestion/connectors/whatsapp.py
# Export: Open chat in WhatsApp > menu > Export chat (without media) > upload .txt here
import re
from datetime import datetime
from ingestion.synthesis import RawMemory

class WhatsAppConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, chat_file='_chat.txt', my_name='Me'):
        memories = []
        pattern = r'(\d{1,2}/\d{1,2}/\d{2,4}),\s(\d{1,2}:\d{2})\s?(?:AM|PM)?\s?-\s?([^:]+):\s(.+)'
        with open(chat_file, 'r', encoding='utf-8') as f:
            for line in f:
                m = re.match(pattern, line.strip())
                if m:
                    date_str, time_str, sender, message = m.groups()
                    try:
                        ts = datetime.strptime(f"{date_str} {time_str}", "%m/%d/%y %H:%M")
                        direction = 'sent to' if sender.strip() == my_name else 'from'
                        memories.append(RawMemory(
                            content=f"WhatsApp message {direction} {sender.strip()}: {message}",
                            timestamp=ts, source='whatsapp'))
                    except: continue
        return memories
