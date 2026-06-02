"""Pytest configuration and shared fixtures for backend tests."""

import sys
from pathlib import Path

# Ensure the backend directory is on sys.path so imports work
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import pytest
from fastapi.testclient import TestClient

# ── Override env before app modules are imported ──────────────────────
# Force in-memory fallback. We need to set this env var before the
# session_manager module is first imported by the TestClient.
import os

os.environ["UPSTASH_REDIS_REST_URL"] = ""
os.environ["UPSTASH_REDIS_REST_TOKEN"] = ""
os.environ["SESSION_TTL_SECONDS"] = "3600"

# ── Import the FastAPI app ────────────────────────────────────────────

@pytest.fixture
def client():
    """Provide a TestClient against the live FastAPI app."""
    # Import here so the env vars above are set first
    from main import app
    from services import session_manager

    # Ensure the in-memory store is clean for each test
    session_manager._memory_store.clear()
    session_manager._using_redis = False

    with TestClient(app) as c:
        yield c
