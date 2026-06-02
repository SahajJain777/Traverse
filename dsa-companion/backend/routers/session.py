import uuid

from fastapi import APIRouter, HTTPException

from models.schemas import SessionCreateResponse
from services.session_manager import create_session, get_session

router = APIRouter()


@router.post("/create", response_model=SessionCreateResponse)
def create_new_session():
    session_id = str(uuid.uuid4())
    create_session(session_id)
    return SessionCreateResponse(session_id=session_id)


@router.get("/{session_id}")
def read_session(session_id: str):
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
