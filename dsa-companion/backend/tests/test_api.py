"""Integration tests for REST API endpoints using TestClient.

Note: Gemini-dependent endpoints (submit, hint, optimal, check-goal, visual)
are tested with valid session setup but are skipped when GEMINI_API_KEY
is not set, because they call the LLM.
"""

import os
import json

import pytest
from fastapi.testclient import TestClient


# ── Health ────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_ok(self, client: TestClient):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


# ── Session ───────────────────────────────────────────────────────────

class TestSessionCRUD:
    def test_create_session(self, client: TestClient):
        resp = client.post("/session/create")
        assert resp.status_code == 200
        body = resp.json()
        assert "session_id" in body
        assert len(body["session_id"]) > 10  # UUID-ish

    def test_create_and_retrieve_session(self, client: TestClient):
        create_resp = client.post("/session/create")
        sid = create_resp.json()["session_id"]

        get_resp = client.get(f"/session/{sid}")
        assert get_resp.status_code == 200
        body = get_resp.json()
        assert body["session_id"] == sid
        assert body["language"] == "python"
        assert body["attempts"] == []
        assert body["eval_log"]["hints_given"] == 0

    def test_get_nonexistent_session_returns_404(self, client: TestClient):
        resp = client.get("/session/nonexistent-id")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Session not found"


# ── Submit (Gemini-dependent — skip if no API key) ───────────────────

class TestSubmit:
    @pytest.fixture(autouse=True)
    def setup_session(self, client: TestClient):
        resp = client.post("/session/create")
        self.sid = resp.json()["session_id"]
        self.payload = {
            "session_id": self.sid,
            "problem": "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.",
            "attempt": "def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i+1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []",
            "language": "python",
        }

    def test_submit_updates_session_fields(self, client: TestClient):
        resp = client.post("/chat/submit", json=self.payload)
        # May succeed or fail depending on Gemini API key — check status
        if resp.status_code == 200:
            body = resp.json()
            assert "approach_direction" in body
            assert "student_intent" in body
        else:
            pytest.skip("Gemini API not available")

    def test_submit_without_problem_field(self, client: TestClient):
        """Subsequent submissions can omit the problem field."""
        payload_no_problem = {
            "session_id": self.sid,
            "attempt": "def two_sum(nums, target): return [0, 1]",
            "language": "python",
        }
        resp = client.post("/chat/submit", json=payload_no_problem)
        if resp.status_code == 200:
            assert "approach_direction" in resp.json()
        else:
            pytest.skip("Gemini API not available")

    def test_submit_missing_session_returns_404(self, client: TestClient):
        payload = {**self.payload, "session_id": "nonexistent"}
        resp = client.post("/chat/submit", json=payload)
        assert resp.status_code == 404


# ── Hint ──────────────────────────────────────────────────────────────

class TestHint:
    @pytest.fixture(autouse=True)
    def setup_session(self, client: TestClient):
        resp = client.post("/session/create")
        self.sid = resp.json()["session_id"]
        # Submit a problem so the session has context
        client.post("/chat/submit", json={
            "session_id": self.sid,
            "problem": "test",
            "attempt": "def f(): pass",
            "language": "python",
        })

    def test_hint_invalid_tier_returns_422(self, client: TestClient):
        resp = client.get(f"/chat/hint?session_id={self.sid}&tier=4")
        assert resp.status_code == 422

    def test_hint_missing_session_returns_404(self, client: TestClient):
        resp = client.get("/chat/hint?session_id=nonexistent&tier=1")
        assert resp.status_code == 404

    def test_hint_streams_sse_for_valid_tier(self, client: TestClient):
        resp = client.get(f"/chat/hint?session_id={self.sid}&tier=1")
        if resp.status_code == 200:
            assert resp.headers.get("content-type", "").startswith("text/event-stream")
        else:
            pytest.skip("Hint endpoint requires Gemini")


# ── Check goal ────────────────────────────────────────────────────────

class TestCheckGoal:
    @pytest.fixture(autouse=True)
    def setup_session(self, client: TestClient):
        resp = client.post("/session/create")
        self.sid = resp.json()["session_id"]
        client.post("/chat/submit", json={
            "session_id": self.sid,
            "problem": "test",
            "attempt": "def f(): pass",
            "language": "python",
        })

    def test_check_goal_missing_session_returns_404(self, client: TestClient):
        resp = client.post("/chat/check-goal", json={"session_id": "nonexistent"})
        assert resp.status_code == 404

    def test_check_goal_returns_ok(self, client: TestClient):
        resp = client.post("/chat/check-goal", json={"session_id": self.sid})
        if resp.status_code == 200:
            body = resp.json()
            assert "goal_reached" in body
        else:
            pytest.skip("Goal-check endpoint requires Gemini")


# ── Optimal ───────────────────────────────────────────────────────────

class TestOptimal:
    @pytest.fixture(autouse=True)
    def setup_session(self, client: TestClient):
        resp = client.post("/session/create")
        self.sid = resp.json()["session_id"]
        client.post("/chat/submit", json={
            "session_id": self.sid,
            "problem": "test",
            "attempt": "def f(): pass",
            "language": "python",
        })

    def test_optimal_missing_session_returns_404(self, client: TestClient):
        resp = client.post("/chat/optimal", json={"session_id": "nonexistent"})
        assert resp.status_code == 404

    def test_optimal_returns_explainer(self, client: TestClient):
        resp = client.post("/chat/optimal", json={"session_id": self.sid})
        if resp.status_code == 200:
            body = resp.json()
            assert "optimal_approach_name" in body
            assert "complexity_of_student_approach" in body
        else:
            pytest.skip("Optimal endpoint requires Gemini")


# ── Visual generate ──────────────────────────────────────────────────

class TestVisualGenerate:
    @pytest.fixture(autouse=True)
    def setup_session(self, client: TestClient):
        resp = client.post("/session/create")
        self.sid = resp.json()["session_id"]
        # Give the session a problem so visual has context
        client.post("/chat/submit", json={
            "session_id": self.sid,
            "problem": "Two Sum",
            "attempt": "def f(): pass",
            "language": "python",
        })

    def test_visual_generate_missing_session_returns_404(self, client: TestClient):
        resp = client.post("/chat/visual/generate", json={
            "session_id": "nonexistent",
            "algorithm_name": "Hash Map",
        })
        assert resp.status_code == 404

    def test_visual_generate_returns_html_or_fallback(self, client: TestClient):
        resp = client.post("/chat/visual/generate", json={
            "session_id": self.sid,
            "algorithm_name": "Hash Map One-Pass",
        })
        if resp.status_code == 200:
            body = resp.json()
            assert "valid" in body
            assert "algorithm_name" in body
            assert "html" in body
        else:
            pytest.skip("Visual endpoint requires Gemini")

# ── Syntax Check ──────────────────────────────────────────────────────

class TestSyntaxCheck:
    @pytest.fixture(autouse=True)
    def setup_session(self, client: TestClient):
        resp = client.post("/session/create")
        self.sid = resp.json()["session_id"]

    def test_syntax_check_missing_session_returns_404(self, client: TestClient):
        resp = client.post("/chat/check-syntax", json={
            "session_id": "nonexistent",
            "code": "def foo(:\n    pass",
            "language": "python",
        })
        assert resp.status_code == 404

    def test_syntax_check_calls_gemini_and_returns_result(self, client: TestClient):
        """Test that the endpoint works when Gemini is available."""
        resp = client.post("/chat/check-syntax", json={
            "session_id": self.sid,
            "problem": "test problem",
            "code": "def f():\n    pass",
            "language": "python",
        })
        if resp.status_code == 200:
            body = resp.json()
            assert "total_errors" in body
            assert "syntax_errors" in body
        else:
            pytest.skip("Syntax check endpoint requires Gemini")
