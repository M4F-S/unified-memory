"""
UnifiedMemory Backend Entry Point (Docker)
Wraps existing workers/local_server.py with minimal changes.
In production Docker, this is served by uvicorn on port 8000.
"""
import sys
from pathlib import Path

# Ensure /app is on path for all imports
_APP_DIR = Path(__file__).resolve().parent.parent
if str(_APP_DIR) not in sys.path:
    sys.path.insert(0, str(_APP_DIR))

# Import the existing FastAPI app from workers/local_server
from workers.local_server import app

# Re-export for uvicorn
__all__ = ["app"]
