"""Tests for the session manager (in-memory fallback)."""

import uuid
from datetime import datetime, timezone

import pytest

from services.session_manager import (
    _memory_store,
    create_session,
    get_session,
    update_session,
    append_message,
)


@pytest.fixture(autouse=True)
def clear_store():
    """Reset the in-memory store before each test."""
    _memory_store.clear()
    yield


# ── Create ────────────────────────────────────────────────────────────

def test_create_session_returns_session():
    sid = str(uuid.uuid4())
    session = create_session(sid)
    assert session["session_id"] == sid
    assert session["language"] == "python"
    assert session["attempts"] == []
    assert session["hint_count"] == 0
    assert session["goal_reached"] is False
    assert session["optimal_shown"] is False
    assert session["eval_log"]["hints_given"] == 0
    assert session["eval_log"]["tiers_used"] == []
    assert session["eval_log"]["goal_iterations"] == 0
    assert session["created_at"] != ""


def test_create_session_with_custom_language():
    sid = str(uuid.uuid4())
    session = create_session(sid, language="java")
    assert session["language"] == "java"


def test_create_session_stores_in_memory():
    sid = str(uuid.uuid4())
    create_session(sid)
    key = f"session:{sid}"
    assert key in _memory_store


# ── Get ───────────────────────────────────────────────────────────────

def test_get_session_returns_none_for_missing():
    assert get_session("nonexistent") is None


def test_get_session_returns_correct_session():
    sid = str(uuid.uuid4())
    created = create_session(sid)
    fetched = get_session(sid)
    assert fetched == created


# ── Update ────────────────────────────────────────────────────────────

def test_update_session_returns_none_for_missing():
    assert update_session("nonexistent", {"problem": "test"}) is None


def test_update_session_modifies_fields():
    sid = str(uuid.uuid4())
    create_session(sid)

    updated = update_session(sid, {"problem": "Two Sum", "goal_reached": True})
    assert updated is not None
    assert updated["problem"] == "Two Sum"
    assert updated["goal_reached"] is True

    # Verify persistence
    fetched = get_session(sid)
    assert fetched["problem"] == "Two Sum"


def test_update_session_merges_with_existing():
    sid = str(uuid.uuid4())
    create_session(sid)
    update_session(sid, {"problem": "A"})
    update_session(sid, {"language": "cpp"})

    fetched = get_session(sid)
    assert fetched["problem"] == "A"
    assert fetched["language"] == "cpp"
    assert fetched["hint_count"] == 0  # unchanged


# ── Append message ────────────────────────────────────────────────────

def test_append_message_adds_to_history():
    sid = str(uuid.uuid4())
    create_session(sid)

    append_message(sid, "user", "def two_sum(): pass")
    append_message(sid, "model", '{"direction": "correct"}')

    fetched = get_session(sid)
    assert len(fetched["conversation_history"]) == 2
    assert fetched["conversation_history"][0]["role"] == "user"
    assert fetched["conversation_history"][1]["content"] == '{"direction": "correct"}'


def test_append_message_returns_none_for_missing():
    assert append_message("nonexistent", "user", "x") is None
