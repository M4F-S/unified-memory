# ingestion/connectors/apple_health.py
# Export: Health app > tap your profile photo > Export All Health Data > upload export.zip
import xml.etree.ElementTree as ET
from datetime import datetime
from collections import defaultdict
from ingestion.synthesis import RawMemory

class AppleHealthConnector:
    def authenticate(self, **kwargs): return True

    def fetch_data(self, export_file='export.xml'):
        tree = ET.parse(export_file)
        root = tree.getroot()
        daily = defaultdict(lambda: defaultdict(float))
        for record in root.findall('Record'):
            rtype = record.get('type', '')
            date = record.get('startDate', '')[:10]
            try:
                v = float(record.get('value', '0'))
                if 'StepCount' in rtype: daily[date]['steps'] += v
                elif 'HeartRate' in rtype: daily[date]['hr'] = v
                elif 'SleepAnalysis' in rtype: daily[date]['sleep'] += 0.5
            except: continue
        memories = []
        for date, s in list(daily.items())[:200]:
            parts = []
            if s.get('steps'): parts.append(f"{int(s['steps'])} steps")
            if s.get('hr'): parts.append(f"HR {int(s['hr'])} bpm")
            if s.get('sleep'): parts.append(f"{s['sleep']:.1f}h sleep")
            if parts:
                memories.append(RawMemory(
                    content=f"Health on {date}: {', '.join(parts)}",
                    timestamp=datetime.strptime(date,'%Y-%m-%d'), source='apple_health'))
        return memories
