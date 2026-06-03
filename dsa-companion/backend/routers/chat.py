import json
import logging

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

from models.schemas import SubmitAttemptRequest, GoalCheckRequest
from services.gemini_service import (
    _get_model,
    analyse_approach,
    answer_socratic,
    check_goal_reached,
    explain_optimal,
    generate_hint,
    generate_visual,
    check_syntax,
)
from services.session_manager import (
    append_message,
    append_socratic_message,
    clear_socratic_chat,
    get_session,
    update_session,
)
from services.visual_validator import validate_visual_html


class _VisualGenerateRequest(BaseModel):
    session_id: str
    algorithm_name: str


class _SyntaxCheckRequest(BaseModel):
    session_id: str
    problem: str = ""
    code: str
    language: str


class _SocraticRequest(BaseModel):
    session_id: str
    last_hint: str
    question: str


router = APIRouter()


@router.post("/submit")
def submit_attempt(body: SubmitAttemptRequest):
    session = get_session(body.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    updates = {
        "language": body.language,
        "attempts": session["attempts"] + [body.attempt],
    }
    if body.problem:
        updates["problem"] = body.problem
    update_session(body.session_id, updates)
    append_message(body.session_id, "user", body.attempt)

    try:
        analysis = analyse_approach(body.problem, body.attempt, body.language)
    except Exception as e:
        logger.error("analyse_approach failed", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="AI analysis service is temporarily unavailable. Please check your API key and try again.",
        )

    append_message(body.session_id, "model", json.dumps(analysis))

    # Store analysis on the session for easy access by other endpoints
    update_session(body.session_id, {"latest_analysis": analysis})

    return analysis


@router.get("/hint")
def stream_hint(
    session_id: str = Query(...),
    tier: int = Query(...),
):
    if tier not in (1, 2, 3):
        raise HTTPException(
            status_code=422,
            detail=f"Invalid tier: {tier}. Must be 1, 2, or 3.",
        )

    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    problem = session.get("problem", "")
    attempts = session.get("attempts", [])
    latest_attempt = attempts[-1] if attempts else ""
    language = session.get("language", "python")
    analysis = session.get("latest_analysis", {})
    history = "\n".join(
        f"{m['role']}: {m['content']}"
        for m in session.get("conversation_history", [])
    )

    # Clear previous socratic chat when a new hint is generated
    clear_socratic_chat(session_id)

    def event_stream():
        full_text = ""
        try:
            for chunk in generate_hint(
                tier, problem, latest_attempt, language, analysis, history
            ):
                full_text += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        except Exception as e:
            logger.error("generate_hint stream failed", exc_info=True)
            yield f"data: {json.dumps({'error': 'Hint generation failed. Please check your API key and try again.'})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
            return

        append_message(session_id, "model", full_text)
        session = get_session(session_id)
        eval_log = session.get("eval_log", {})
        eval_log["hints_given"] = eval_log.get("hints_given", 0) + 1
        tiers = eval_log.setdefault("tiers_used", [])
        if tier not in tiers:
            tiers.append(tier)
        update_session(session_id, {"eval_log": eval_log})

        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/check-goal")
def check_goal(body: GoalCheckRequest):
    session = get_session(body.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    problem = session.get("problem", "")
    attempts = session.get("attempts", [])
    language = session.get("language", "python")
    latest_attempt = attempts[-1] if attempts else ""
    analysis = session.get("latest_analysis", {})
    student_intent = analysis.get("student_intent", "")

    try:
        result = check_goal_reached(problem, latest_attempt, language, student_intent)
    except Exception as e:
        logger.error("check_goal_reached failed", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="Goal check service is temporarily unavailable. Please check your API key and try again.",
        )

    if result.get("goal_reached"):
        eval_log = session.get("eval_log", {})
        eval_log["goal_iterations"] = eval_log.get("goal_iterations", 0) + 1
        update_session(body.session_id, {"goal_reached": True, "eval_log": eval_log})

    return result


@router.post("/optimal")
def get_optimal(body: GoalCheckRequest):
    session = get_session(body.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    problem = session.get("problem", "")
    attempts = session.get("attempts", [])
    language = session.get("language", "python")
    latest_attempt = attempts[-1] if attempts else ""

    try:
        result = explain_optimal(problem, latest_attempt, language)
    except Exception as e:
        logger.error("explain_optimal failed", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="Optimal explanation service is temporarily unavailable. Please check your API key and try again.",
        )

    update_session(body.session_id, {"optimal_shown": True})

    return result


@router.post("/visual/generate")
def generate_visual_endpoint(body: _VisualGenerateRequest):
    session = get_session(body.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    problem = session.get("problem", "")
    language = session.get("language", "python")

    try:
        result = generate_visual(problem, body.algorithm_name, language)
    except Exception as e:
        logger.error("generate_visual failed", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="Visual generation service is temporarily unavailable. Please check your API key and try again.",
        )

    # Validate the generated HTML
    html = result.get("html", "")
    is_valid, reason = validate_visual_html(html)

    # Update eval counters
    eval_log = session.get("eval_log", {})

    if is_valid and html:
        eval_log["visual_generated"] = eval_log.get("visual_generated", 0) + 1
        update_session(body.session_id, {"eval_log": eval_log})
        return {"html": html, "algorithm_name": body.algorithm_name, "valid": True}
    else:
        # Validation failed — provide a text fallback
        eval_log["visual_failed"] = eval_log.get("visual_failed", 0) + 1
        update_session(body.session_id, {"eval_log": eval_log})

        # Generate a text-based step-by-step fallback
        fallback_prompt = (
            f"Explain the {body.algorithm_name} algorithm for this problem step by step in plain English. "
            f"Describe what data structures are used, what each step does, and how the state changes. "
            f"Keep it under 10 sentences. No code."
        )
        model = _get_model()
        fallback_response = model.invoke(fallback_prompt)
        fallback_text = fallback_response.content

        return {
            "html": "",
            "algorithm_name": body.algorithm_name,
            "valid": False,
            "fallback_text": fallback_text,
            "validation_error": reason,
        }


@router.post("/socratic")
def socratic_answer(body: _SocraticRequest):
    """Answer a Socratic follow-up question for the current hint."""
    session = get_session(body.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    problem = session.get("problem", "")
    attempts = session.get("attempts", [])
    last_attempt = attempts[-1] if attempts else ""
    language = session.get("language", "python")

    # Build conversation history from socratic_chat
    chat = session.get("socratic_chat", [])
    conv_history = "\n".join(
        f"Student: {m['content']}" if m['role'] == 'user' else f"Tutor: {m['content']}"
        for m in chat
    )

    # Save the student's question
    append_socratic_message(body.session_id, "user", body.question)

    try:
        response = answer_socratic(
            problem=problem,
            last_attempt=last_attempt,
            language=language,
            last_hint=body.last_hint,
            conversation_history=conv_history,
            student_question=body.question,
        )
    except Exception as e:
        logger.error("socratic_answer failed", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="Socratic tutor service is temporarily unavailable. Please check your API key and try again.",
        )

    # Save the tutor's response
    append_socratic_message(body.session_id, "model", response)

    return {"response": response}


@router.post("/check-syntax")
def check_syntax_endpoint(body: _SyntaxCheckRequest):
    session = get_session(body.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        result = check_syntax(body.problem, body.code, body.language)
    except Exception as e:
        logger.error("check_syntax failed", exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="Syntax check service is temporarily unavailable. Please check your API key and try again.",
        )

    return result
