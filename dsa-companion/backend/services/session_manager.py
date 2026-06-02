import json
from datetime import datetime, timezone
from typing import Optional

from config import (
    UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN,
    SESSION_TTL_SECONDS,
)

# Try to connect to Upstash Redis if credentials are provided.
# Fall back to an in-memory dictionary for local development.
_redis = None
_memory_store: dict[str, str] = {}
_using_redis = False

if UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN:
    try:
        from upstash_redis import Redis

        _redis = Redis(url=UPSTASH_REDIS_REST_URL, token=UPSTASH_REDIS_REST_TOKEN)
        _redis.ping()
        _using_redis = True
    except Exception:
        _redis = None


def _session_key(session_id: str) -> str:
    return f"session:{session_id}"


def _default_session(session_id: str, language: str = "python") -> dict:
    return {
        "session_id": session_id,
        "problem": "",
        "language": language,
        "attempts": [],
        "hint_count": 0,
        "goal_reached": False,
        "optimal_shown": False,
        "conversation_history": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "eval_log": {
            "hints_given": 0,
            "tiers_used": [],
            "goal_iterations": 0,
        },
    }


def create_session(session_id: str, language: str = "python") -> dict:
    session = _default_session(session_id, language)
    key = _session_key(session_id)
    raw = json.dumps(session)

    if _using_redis:
        _redis.set(key, raw)
        _redis.expire(key, SESSION_TTL_SECONDS)
    else:
        _memory_store[key] = raw

    return session


def get_session(session_id: str) -> Optional[dict]:
    key = _session_key(session_id)

    if _using_redis:
        raw = _redis.get(key)
    else:
        raw = _memory_store.get(key)

    if raw is None:
        return None
    return json.loads(raw)


def update_session(session_id: str, updates: dict) -> Optional[dict]:
    session = get_session(session_id)
    if session is None:
        return None

    session.update(updates)
    key = _session_key(session_id)
    raw = json.dumps(session)

    if _using_redis:
        _redis.set(key, raw)
        _redis.expire(key, SESSION_TTL_SECONDS)
    else:
        _memory_store[key] = raw

    return session


def append_message(session_id: str, role: str, content: str) -> Optional[dict]:
    session = get_session(session_id)
    if session is None:
        return None

    session["conversation_history"].append({"role": role, "content": content})
    key = _session_key(session_id)
    raw = json.dumps(session)

    if _using_redis:
        _redis.set(key, raw)
        _redis.expire(key, SESSION_TTL_SECONDS)
    else:
        _memory_store[key] = raw

    return session
