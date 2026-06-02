# Phase 3 Summary — Prompt Engineering & Hint System

## Prompts written

All prompt files were already populated with well-crafted content from earlier work. The only prompt requiring orchestrator approval was:

- **`visual_generator.txt`** — Approved by orchestrator. Asks Gemini to generate a self-contained HTML animation of an algorithm with step-forward/back buttons, variable state panel, and data structure visualisations. Uses `{{PROBLEM}}`, `{{ALGORITHM_NAME}}`, `{{LANGUAGE}}` placeholders. Outputs JSON with `html` and `algorithm_name` fields.

## Functions built

### `services/prompt_builder.py`
- `load_prompt(filename)` — reads a `.txt` prompt file
- `build_analysis_prompt(problem, attempt, language)` — injects into approach_analyser.txt
- `build_hint_prompt(tier, problem, attempt, language, analysis, history)` — injects into the correct tier file
- `build_goal_check_prompt(problem, latest_attempt, language, student_intent)` — injects into goal_reached_check.txt
- `build_optimal_prompt(problem, student_solution, language)` — injects into optimal_explainer.txt
- `build_visual_prompt(problem, algorithm_name, language)` — injects into visual_generator.txt (added this phase)

### `services/gemini_service.py`
- `analyse_approach(problem, attempt, language)` — calls Gemini, returns JSON dict
- `generate_hint(tier, problem, attempt, language, analysis, history)` — streams text chunks from Gemini
- `check_goal_reached(problem, latest_attempt, language, student_intent)` — calls Gemini, returns JSON dict
- `explain_optimal(problem, student_solution, language)` — calls Gemini, returns JSON dict
- `generate_visual(problem, algorithm_name, language)` — calls Gemini with the visual generator prompt (upgraded from stub this phase)

### `frontend/src/hooks/useSSE.js`
- Opens an `EventSource` on a given URL, accumulates streamed chunks into `streamedText`
- Exposes `{ streamedText, isStreaming, error, reset, start }`
- Auto-closes on unmount or when `done` signal received

## Endpoints built (in `routers/chat.py`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat/submit` | Receives problem + attempt, runs approach analysis, stores in session |
| GET | `/chat/hint` | SSE streaming — receives `session_id` + `tier`, streams hint text |
| POST | `/chat/check-goal` | Checks if student reached their own goal |
| POST | `/chat/optimal` | Returns optimal approach explanation |
| POST | `/chat/visual/generate` | Generates HTML algorithm visualisation |

## Verification results

- **Backend import:** PASS — all modules import without errors
- **Frontend build:** PASS — Vite builds 34 modules in 563ms
- **Approach analysis:** PASS — Two Sum brute force returned:
  ```json
  {
    "student_intent": "The student is trying to find two numbers in the input array that sum up to the target value and return their indices.",
    "approach_direction": "correct_path",
    "concept_gap": "The student's solution has a time complexity of O(n^2)...",
    "encouragement": "The student correctly identified the need for nested loops..."
  }
  ```
- **Tier 1 hint streaming:** PASS — SSE events streamed with `chunk` fields followed by `done: true`
- **Goal check:** PASS — returned `{"goal_reached": true, "reason": "The code successfully finds two numbers..."}`

## Notes

- **Visual Generator prompt** was written this phase (approved by orchestrator) though its endpoint wiring is technically Phase 5 work. It's included here since the prompt was completed.
- **Import ordering** in `chat.py` was cleaned up after code review feedback — `pydantic.BaseModel` moved to top, service imports alphabetized, redundant `get_session` call removed.
- **Python 3.9 warnings** appear on startup (end-of-life version + deprecated `google.generativeai` package). These are non-blocking.
