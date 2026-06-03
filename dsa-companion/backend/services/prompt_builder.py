import os

from config import PROMPTS_DIR


def load_prompt(filename: str) -> str:
    """Read a .txt prompt file from the prompts directory."""
    path = os.path.join(PROMPTS_DIR, filename)
    with open(path, "r") as f:
        return f.read()


def build_analysis_prompt(problem: str, attempt: str, language: str) -> str:
    template = load_prompt("approach_analyser.txt")
    return (
        template.replace("{{PROBLEM}}", problem)
        .replace("{{ATTEMPT}}", attempt)
        .replace("{{LANGUAGE}}", language)
    )


def build_hint_prompt(
    tier: int,
    problem: str,
    attempt: str,
    language: str,
    analysis: dict,
    history: str,
) -> str:
    filenames = {1: "hint_tier_1.txt", 2: "hint_tier_2.txt", 3: "hint_tier_3.txt"}
    if tier not in filenames:
        raise ValueError(f"Invalid hint tier: {tier}. Must be 1, 2, or 3.")
    filename = filenames[tier]
    template = load_prompt(filename)
    result = (
        template.replace("{{PROBLEM}}", problem)
        .replace("{{ATTEMPT}}", attempt)
        .replace("{{LANGUAGE}}", language)
        .replace("{{ANALYSIS}}", str(analysis))
    )
    # Only tiers 2 and 3 include the history placeholder
    if tier > 1:
        result = result.replace("{{HISTORY}}", history)
    return result


def build_goal_check_prompt(
    problem: str, latest_attempt: str, language: str, student_intent: str
) -> str:
    template = load_prompt("goal_reached_check.txt")
    return (
        template.replace("{{PROBLEM}}", problem)
        .replace("{{ATTEMPT}}", latest_attempt)
        .replace("{{LANGUAGE}}", language)
        .replace("{{STUDENT_INTENT}}", student_intent)
    )


def build_optimal_prompt(problem: str, student_solution: str, language: str) -> str:
    template = load_prompt("optimal_explainer.txt")
    return (
        template.replace("{{PROBLEM}}", problem)
        .replace("{{SOLUTION}}", student_solution)
        .replace("{{LANGUAGE}}", language)
    )


def build_visual_prompt(problem: str, algorithm_name: str, language: str) -> str:
    template = load_prompt("visual_generator.txt")
    return (
        template.replace("{{PROBLEM}}", problem)
        .replace("{{ALGORITHM_NAME}}", algorithm_name)
        .replace("{{LANGUAGE}}", language)
    )


def build_socratic_prompt(
    problem: str,
    last_attempt: str,
    language: str,
    last_hint: str,
    conversation_history: str,
    student_question: str,
) -> str:
    template = load_prompt("socratic_tutor.txt")
    return (
        template.replace("{{PROBLEM}}", problem)
        .replace("{{LAST_ATTEMPT}}", last_attempt)
        .replace("{{LANGUAGE}}", language)
        .replace("{{LAST_HINT}}", last_hint)
        .replace("{{CONVERSATION_HISTORY}}", conversation_history)
        .replace("{{STUDENT_QUESTION}}", student_question)
    )


def build_syntax_check_prompt(problem: str, code: str, language: str) -> str:
    template = load_prompt("syntax_analyser.txt")
    return (
        template.replace("{{PROBLEM}}", problem)
        .replace("{{CODE}}", code)
        .replace("{{LANGUAGE}}", language)
    )
