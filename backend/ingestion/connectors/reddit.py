# ingestion/connectors/reddit.py
import os
from datetime import datetime
import praw
from ingestion.synthesis import RawMemory

class RedditConnector:
    def authenticate(self):
        self.reddit = praw.Reddit(
            client_id=os.getenv('REDDIT_CLIENT_ID'),
            client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
            user_agent='UnifiedMemory/1.0',
            username=os.getenv('REDDIT_USERNAME'),
            password=os.getenv('REDDIT_PASSWORD'))
        return True

    def fetch_data(self):
        memories = []
        user = self.reddit.user.me()
        for post in user.submissions.new(limit=100):
            memories.append(RawMemory(
                content=f"Reddit post in r/{post.subreddit}: {post.title} — {post.selftext[:200]}",
                timestamp=datetime.fromtimestamp(post.created_utc), source='reddit'))
        for comment in user.comments.new(limit=200):
            memories.append(RawMemory(
                content=f"Reddit comment in r/{comment.subreddit}: {comment.body[:200]}",
                timestamp=datetime.fromtimestamp(comment.created_utc), source='reddit'))
        return memories
