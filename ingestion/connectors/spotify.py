# ingestion/connectors/spotify.py
import os
from datetime import datetime
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from ingestion.synthesis import RawMemory

class SpotifyConnector:
    def authenticate(self):
        self.sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
            client_id=os.getenv('SPOTIFY_CLIENT_ID'),
            client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
            redirect_uri='http://localhost:8888/callback',
            scope='user-read-recently-played user-top-read user-library-read'))
        return True

    def fetch_data(self):
        memories = []
        recent = self.sp.current_user_recently_played(limit=50)
        for item in recent['items']:
            track = item['track']
            ts = datetime.fromisoformat(item['played_at'].replace('Z', '+00:00'))
            memories.append(RawMemory(
                content=f"Listened to '{track['name']}' by {track['artists'][0]['name']}",
                timestamp=ts, source='spotify'))
        top = self.sp.current_user_top_tracks(limit=20, time_range='medium_term')
        for t in top['items']:
            memories.append(RawMemory(
                content=f"Top track: '{t['name']}' by {t['artists'][0]['name']}",
                timestamp=datetime.now(), source='spotify'))
        return memories
