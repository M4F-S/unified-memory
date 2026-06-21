# ingestion/connectors/github.py
import os
from datetime import datetime
from github import Github
from ingestion.synthesis import RawMemory

class GitHubConnector:
    def authenticate(self, token=None):
        self.gh = Github(token or os.getenv('GITHUB_TOKEN'))
        self.user = self.gh.get_user()
        return True

    def fetch_data(self, max_repos=20):
        memories = []
        for repo in list(self.user.get_repos())[:max_repos]:
            try:
                for commit in list(repo.get_commits())[:50]:
                    memories.append(RawMemory(
                        content=f"GitHub commit in {repo.name}: {commit.commit.message}",
                        timestamp=commit.commit.author.date,
                        source='github', url=commit.html_url))
            except: continue
        return memories
