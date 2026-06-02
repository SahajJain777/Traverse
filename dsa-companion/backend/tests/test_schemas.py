"""Tests for Pydantic request/response schemas."""

from models.schemas import (
    SessionCreateResponse,
    SessionState,
    SubmitAttemptRequest,
    GoalCheckRequest,
)


class TestSessionCreateResponse:
    def test_valid(self):
        resp = SessionCreateResponse(session_id="abc-123")
        assert resp.session_id == "abc-123"

    def test_serializes_correctly(self):
        resp = SessionCreateResponse(session_id="abc-123")
        data = resp.model_dump()
        assert data == {"session_id": "abc-123"}


class TestSessionState:
    def test_defaults(self):
        state = SessionState(session_id="s1")
        assert state.session_id == "s1"
        assert state.problem == ""
        assert state.language == "python"
        assert state.attempts == []
        assert state.hint_count == 0
        assert state.goal_reached is False
        assert state.optimal_shown is False
        assert state.conversation_history == []
        assert state.created_at == ""

    def test_eval_log_default_factory_is_independent(self):
        s1 = SessionState(session_id="s1")
        s2 = SessionState(session_id="s2")
        s1.eval_log["hints_given"] = 5
        assert s2.eval_log["hints_given"] == 0  # Must not be shared

    def test_custom_values(self):
        state = SessionState(
            session_id="s1",
            problem="Two Sum",
            language="java",
            attempts=["code1"],
            hint_count=2,
            goal_reached=True,
        )
        assert state.problem == "Two Sum"
        assert state.language == "java"
        assert len(state.attempts) == 1
        assert state.hint_count == 2
        assert state.goal_reached is True

    def test_serializes_correctly(self):
        state = SessionState(session_id="s1")
        data = state.model_dump()
        assert data["session_id"] == "s1"
        assert data["eval_log"]["hints_given"] == 0


class TestSubmitAttemptRequest:
    def test_all_fields(self):
        req = SubmitAttemptRequest(
            session_id="s1",
            problem="Two Sum",
            attempt="def f(): pass",
            language="python",
        )
        assert req.session_id == "s1"
        assert req.problem == "Two Sum"

    def test_problem_defaults_to_empty(self):
        req = SubmitAttemptRequest(
            session_id="s1",
            attempt="def f(): pass",
            language="python",
        )
        assert req.problem == ""

    def test_serializes_correctly(self):
        req = SubmitAttemptRequest(
            session_id="s1", attempt="code", language="cpp"
        )
        data = req.model_dump()
        assert data["session_id"] == "s1"
        assert data["problem"] == ""
        assert data["language"] == "cpp"


class TestGoalCheckRequest:
    def test_valid(self):
        req = GoalCheckRequest(session_id="s1")
        assert req.session_id == "s1"

    def test_serializes_correctly(self):
        req = GoalCheckRequest(session_id="s1")
        assert req.model_dump() == {"session_id": "s1"}
