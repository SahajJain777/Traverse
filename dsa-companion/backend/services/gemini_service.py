import json
import re

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from config import (
    GEMINI_API_KEY,
    NVIDIA_API_KEY,
    NVIDIA_BASE_URL,
    NVIDIA_MODEL,
    FIREWORKS_API_KEY,
    FIREWORKS_BASE_URL,
    FIREWORKS_MODEL,
    FIREWORKS_TEMPERATURE,
    FIREWORKS_MAX_TOKENS,
    LLM_PROVIDER,
)
from services.prompt_builder import (
    build_analysis_prompt,
    build_hint_prompt,
    build_goal_check_prompt,
    build_optimal_prompt,
    build_visual_prompt,
    build_syntax_check_prompt,
    build_socratic_prompt,
)

# LangChain tracing (LangSmith) is automatically enabled when these env vars are set:
#   LANGCHAIN_TRACING_V2=true
#   LANGCHAIN_API_KEY=<your-key>
# No code changes needed — just set the environment variables.


_gemini_model = None
_nvidia_model = None
_fireworks_model = None


def _get_gemini_model():
    """Lazily initialise the Gemini model."""
    global _gemini_model
    if _gemini_model is None:
        if not GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Set it in your .env file or environment variables."
            )
        _gemini_model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.3,
        )
    return _gemini_model


def _get_nvidia_model():
    """Lazily initialise the NVIDIA (OpenAI-compatible) model."""
    global _nvidia_model
    if _nvidia_model is None:
        if not NVIDIA_API_KEY:
            raise RuntimeError(
                "NVIDIA_API_KEY is not set. Set it in your .env file or environment variables."
            )
        _nvidia_model = ChatOpenAI(
            model=NVIDIA_MODEL,
            api_key=NVIDIA_API_KEY,
            base_url=NVIDIA_BASE_URL,
            temperature=0.3,
            max_tokens=8192,
        )
    return _nvidia_model


def _get_fireworks_model():
    """Lazily initialise the Fireworks AI (OpenAI-compatible) model."""
    global _fireworks_model
    if _fireworks_model is None:
        if not FIREWORKS_API_KEY:
            raise RuntimeError(
                "FIREWORKS_API_KEY is not set. Set it in your .env file or environment variables."
            )
        _fireworks_model = ChatOpenAI(
            model=FIREWORKS_MODEL,
            api_key=FIREWORKS_API_KEY,
            base_url=FIREWORKS_BASE_URL,
            temperature=FIREWORKS_TEMPERATURE,
            max_tokens=FIREWORKS_MAX_TOKENS,
            top_p=1,
        )
    return _fireworks_model


def _get_llm():
    """Return the model instance based on the configured LLM_PROVIDER."""
    if LLM_PROVIDER == "nvidia":
        return _get_nvidia_model()
    if LLM_PROVIDER == "fireworks":
        return _get_fireworks_model()
    return _get_gemini_model()


def _strip_markdown(text: str) -> str:
    """Remove markdown code fences (```json ... ```) from model output."""
    text = re.sub(r"```(?:json)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def _parse_json(text: str) -> dict:
    """Parse JSON from model output, stripping any markdown fences first."""
    cleaned = _strip_markdown(text)
    return json.loads(cleaned)


def analyse_approach(problem: str, attempt: str, language: str) -> dict:
    model = _get_llm()
    prompt = build_analysis_prompt(problem, attempt, language)
    response = model.invoke(prompt)
    return _parse_json(response.content)


def generate_hint(
    tier: int,
    problem: str,
    attempt: str,
    language: str,
    analysis: dict,
    history: str,
):
    """Yields text chunks as the model streams the response."""
    model = _get_llm()
    prompt = build_hint_prompt(tier, problem, attempt, language, analysis, history)
    stream = model.stream(prompt)
    for chunk in stream:
        if chunk.content:
            yield chunk.content


def check_goal_reached(
    problem: str, latest_attempt: str, language: str, student_intent: str
) -> dict:
    model = _get_llm()
    prompt = build_goal_check_prompt(problem, latest_attempt, language, student_intent)
    response = model.invoke(prompt)
    return _parse_json(response.content)


def explain_optimal(problem: str, student_solution: str, language: str) -> dict:
    model = _get_llm()
    prompt = build_optimal_prompt(problem, student_solution, language)
    response = model.invoke(prompt)
    return _parse_json(response.content)


def generate_visual(problem: str, algorithm_name: str, language: str) -> dict:
    model = _get_llm()
    prompt = build_visual_prompt(problem, algorithm_name, language)
    response = model.invoke(prompt)
    return _parse_json(response.content)


def check_syntax(problem: str, code: str, language: str) -> dict:
    """Analyse code for syntax errors and return corrections."""
    model = _get_llm()
    prompt = build_syntax_check_prompt(problem, code, language)
    response = model.invoke(prompt)
    return _parse_json(response.content)


def answer_socratic(
    problem: str,
    last_attempt: str,
    language: str,
    last_hint: str,
    conversation_history: str,
    student_question: str,
) -> str:
    """Answer a Socratic follow-up question with a guiding response."""
    model = _get_llm()
    prompt = build_socratic_prompt(
        problem, last_attempt, language, last_hint, conversation_history, student_question
    )
    response = model.invoke(prompt)
    return response.content.strip()


# Backward-compatible alias for code that still imports _get_model
_get_model = _get_llm
