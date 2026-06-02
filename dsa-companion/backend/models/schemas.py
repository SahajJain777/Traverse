from pydantic import BaseModel


class SessionCreateResponse(BaseModel):
    session_id: str


from pydantic import Field


class SessionState(BaseModel):
    session_id: str
    problem: str = ""
    language: str = "python"
    attempts: list[str] = []
    hint_count: int = 0
    goal_reached: bool = False
    optimal_shown: bool = False
    conversation_history: list[dict] = []
    created_at: str = ""
    eval_log: dict = Field(
        default_factory=lambda: {
            "hints_given": 0,
            "tiers_used": [],
            "goal_iterations": 0,
        }
    )


class SubmitAttemptRequest(BaseModel):
    session_id: str
    problem: str = ""
    attempt: str
    language: str


class HintRequest(BaseModel):
    session_id: str
    tier: int


class GoalCheckRequest(BaseModel):
    session_id: str
