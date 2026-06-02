# DSA Learning Companion — 7-Phase Build Plan

> Written for AI agent execution. Read this entire header before starting Phase 1.

## Rules for the Agent

- Read SPEC.md fully before starting any phase.
- Complete every numbered step in a phase before moving to the next phase.
- Write code simply. If a solution feels complex, it probably is — simplify it.
- Write code the way a human developer would write it on their first pass: clear, readable, no clever tricks.
- For every prompt file (.txt in the `prompts/` folder): STOP before writing it. Explain to the orchestrator in plain English — (a) what this prompt is trying to make Gemini do, (b) what context/variables Gemini will receive, (c) what the output format will be. Wait for the orchestrator to confirm before writing the prompt content.
- After completing all steps in a phase, write a phase summary file (instructions at the end of each phase).
- If a step is ambiguous, do the simpler interpretation.

---

## Phase 1 — Project Scaffold & Configuration

**Goal:** Create the full folder structure, install all dependencies, wire up env config. No business logic.

**Skills to read first:** None. Follow the repo structure from SPEC.md exactly.

### Steps

1. Create the root directory `dsa-companion/` with subdirectories: `backend/`, `frontend/`, `prompts/`, `evals/`, `phase-summaries/`.

2. Inside `backend/`, create these empty files:
   - `main.py`
   - `config.py`
   - `requirements.txt`
   - `routers/__init__.py`
   - `routers/session.py`
   - `routers/chat.py`
   - `services/__init__.py`
   - `services/gemini_service.py`
   - `services/prompt_builder.py`
   - `services/session_manager.py`
   - `services/visual_validator.py`
   - `models/__init__.py`
   - `models/schemas.py`

3. Inside `prompts/`, create these empty `.txt` files:
   - `approach_analyser.txt`
   - `hint_tier_1.txt`
   - `hint_tier_2.txt`
   - `hint_tier_3.txt`
   - `goal_reached_check.txt`
   - `optimal_explainer.txt`
   - `visual_generator.txt`

4. Create `evals/session_log.csv` with only the header row:
   ```
   session_id,problem_hash,language,total_attempts,hints_tier1,hints_tier2,hints_tier3,goal_reached,optimal_viewed,visual_generated,visual_failed
   ```

5. Populate `requirements.txt`:
   ```
   fastapi
   uvicorn[standard]
   python-dotenv
   google-generativeai
   langchain
   langchain-google-genai
   upstash-redis
   pydantic
   python-multipart
   httpx
   slowapi
   ```

6. Populate `config.py`. Keep it simple — just load env vars and expose them as module-level constants:
   ```python
   import os
   from dotenv import load_dotenv

   load_dotenv()

   GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
   UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL")
   UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")
   FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
   SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", 3600))
   ```

7. Create `.env.example` at the project root with all keys listed and empty values (see SPEC.md Environment Variables section).

8. Populate `main.py`. Keep it minimal:
   - Create the FastAPI app instance.
   - Add CORS middleware allowing `FRONTEND_URL` and `http://localhost:5173`.
   - Include the session and chat routers (they are empty right now — that is fine).
   - Add `GET /health` that returns `{"status": "ok"}`.
   - Add `if __name__ == "__main__"` block to run uvicorn on port 8000.

9. Scaffold the React frontend inside `frontend/`:
   ```bash
   npm create vite@latest . -- --template react
   npm install
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   npm install @monaco-editor/react axios
   ```

10. Set up the folder structure inside `frontend/src/`:
    - Create `components/` (empty)
    - Create `hooks/` (empty)
    - Create `api/` (empty)
    - Create `constants/index.js` with placeholder exports (empty arrays/objects for now)
    - Create `styles/tokens.css` with a comment: `/* CSS custom properties go here — Phase 4 */`

11. Configure `tailwind.config.js` to scan `./src/**/*.{js,jsx}`.

12. Create `frontend/src/api/client.js`:
    ```js
    import axios from 'axios'

    const client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    })

    export default client
    ```

13. Create `frontend/.env.example` with `VITE_API_BASE_URL=http://localhost:8000`.

14. Verify: run `uvicorn main:app --reload` from `backend/` — confirm `/health` returns 200.

15. Verify: run `npm run dev` from `frontend/` — confirm the browser opens on port 5173 with no errors.

### Phase 1 Summary

After completing all steps above, create `phase-summaries/phase-1-summary.md` with the following sections:

```markdown
# Phase 1 Summary — Project Scaffold & Configuration

## What was created
- List every file and folder created, one per line.

## Verification results
- Backend /health: [PASS/FAIL]
- Frontend dev server: [PASS/FAIL]

## Dependencies installed
- List all pip packages installed.
- List all npm packages installed.

## Notes
- Any deviations from the plan, or issues encountered.
```

---

## Phase 2 — Session Management & Redis Integration

**Goal:** Build the session creation and retrieval system backed by Upstash Redis.

**Skills to read first:** None required.

### Steps

1. Populate `models/schemas.py` with Pydantic models. Keep the models flat and simple:
   - `SessionCreateResponse` — field: `session_id: str`
   - `SessionState` — all fields from the session schema in SPEC.md
   - `SubmitAttemptRequest` — fields: `session_id: str`, `problem: str`, `attempt: str`, `language: str`
   - `HintRequest` — fields: `session_id: str`, `tier: int`
   - `GoalCheckRequest` — fields: `session_id: str`

2. Populate `services/session_manager.py`. Write four simple functions, nothing more:
   - `create_session(session_id, language)` — builds the default session dict (from SPEC.md schema), writes it to Redis as JSON, sets TTL.
   - `get_session(session_id)` — reads from Redis, parses JSON, returns dict or None.
   - `update_session(session_id, updates)` — gets the current session, merges the updates dict into it, writes back.
   - `append_message(session_id, role, content)` — gets session, appends `{"role": role, "content": content}` to `conversation_history`, writes back.

   Use the Upstash Redis HTTP client (REST-based, not socket-based) since Render free tier does not support persistent socket connections reliably.

3. Populate `routers/session.py`:
   - `POST /session/create` — generates a UUID, calls `create_session`, returns `SessionCreateResponse`.
   - `GET /session/{session_id}` — calls `get_session`, returns the session dict or raises HTTP 404.

4. Register the session router in `main.py` with prefix `/session`.

5. Create `frontend/src/hooks/useSession.js`:
   - On component mount, check `localStorage` for `dsa_session_id`.
   - If none, call `POST /session/create`, store the returned `session_id` in localStorage.
   - Expose `sessionId`, `sessionState`, and a `refreshSession` function that re-fetches `GET /session/{session_id}`.
   - Keep the hook simple — no complex caching, just fetch and store.

6. Verify: use a REST client (curl or the FastAPI `/docs` page) to create a session, then retrieve it, and confirm the JSON blob looks correct.

### Phase 2 Summary

Create `phase-summaries/phase-2-summary.md`:

```markdown
# Phase 2 Summary — Session Management & Redis Integration

## What was built
- List each function and endpoint created.

## Session schema confirmation
- Paste an example session JSON blob retrieved from Redis.

## Verification results
- POST /session/create: [PASS/FAIL]
- GET /session/{id}: [PASS/FAIL]
- Redis TTL set correctly: [PASS/FAIL]

## Notes
- Any issues with Redis connection or schema mismatches.
```

---

## Phase 3 — Prompt Engineering & Hint System (Core Feature)

**Goal:** Write all system prompts and build the hint pipeline. This is the most critical phase.

**IMPORTANT for the agent:** Every prompt file requires orchestrator approval before writing. For each prompt, follow this sequence exactly:
1. Stop.
2. Write a short explanation to the orchestrator covering: what this prompt asks Gemini to do, what variables/context will be injected, and what the response format will be.
3. Wait for the orchestrator to respond with confirmation or changes.
4. Only then write the prompt file.

**Skills to read first:** None for code. The prompts ARE the engineering work.

### Steps

1. **Approach Analyser prompt** (`prompts/approach_analyser.txt`):

   Before writing — explain to the orchestrator:
   > "This prompt is sent when a student submits their first attempt. Gemini receives the problem statement, the student's code, and the language they used. Gemini analyses what the student is trying to do — not whether it's correct, but what their thinking is. The output is a JSON object with four fields: student_intent (what they're trying to do), approach_direction (correct_path / wrong_path / partially_correct), concept_gap (what they're missing), and encouragement (one sentence on what they got right). Gemini must not reveal the solution or name the optimal algorithm."

   Wait for confirmation. Then write the prompt.

2. **Hint Tier 1 prompt** (`prompts/hint_tier_1.txt`):

   Before writing — explain to the orchestrator:
   > "This prompt is used when the student clicks 'Subtle hint'. Gemini receives the problem, the student's code, the language, and the approach analysis from step 1. The output is a short guiding question or nudge — no algorithm names, no method names. Maximum 3 sentences. The goal is to make the student think differently without giving anything away."

   Wait for confirmation. Then write the prompt.

3. **Hint Tier 2 prompt** (`prompts/hint_tier_2.txt`):

   Before writing — explain to the orchestrator:
   > "This prompt is used when the student clicks 'Method hint'. Gemini receives the same context as tier 1 plus the conversation history so far. The output names the algorithmic category (e.g. 'two pointers', 'sliding window') and explains why this category fits the problem. Maximum 5 sentences. No code, no pseudocode."

   Wait for confirmation. Then write the prompt.

4. **Hint Tier 3 prompt** (`prompts/hint_tier_3.txt`):

   Before writing — explain to the orchestrator:
   > "This prompt is used when the student clicks 'Step-by-step hint'. Gemini receives full context including history. The output walks through the exact steps to solve the problem in plain English — not code, not pseudocode. Maximum 8 sentences. Ends with an encouraging line to try implementing it."

   Wait for confirmation. Then write the prompt.

5. **Goal Reached Check prompt** (`prompts/goal_reached_check.txt`):

   Before writing — explain to the orchestrator:
   > "This prompt runs after every new attempt the student submits. Gemini receives the original problem, the student's latest code, and the student_intent from the original analysis. It checks if the student has successfully implemented what they were originally trying to do — not whether it's optimal, just whether they've reached their own goal. Output is JSON: { goal_reached: true/false, reason: string }."

   Wait for confirmation. Then write the prompt.

6. **Optimal Explainer prompt** (`prompts/optimal_explainer.txt`):

   Before writing — explain to the orchestrator:
   > "This prompt runs after the student reaches their goal, when they click 'See optimal approach'. Gemini receives the problem, the student's achieved solution, and the language. It explains the limitations of the student's approach (complexity), introduces the optimal approach by name, explains why it's better, and identifies the key insight the student was missing. Output is JSON with fields: complexity_of_student_approach, optimal_approach_name, why_it_is_better, key_insight. No code."

   Wait for confirmation. Then write the prompt.

7. Populate `services/prompt_builder.py`. Simple file-loading and string injection:
   - `load_prompt(filename)` — reads a `.txt` file from the `prompts/` directory, returns the string.
   - `build_analysis_prompt(problem, attempt, language)` — loads `approach_analyser.txt`, replaces placeholders for problem, attempt, language.
   - `build_hint_prompt(tier, problem, attempt, language, analysis, history)` — loads the correct tier file, injects all context.
   - `build_goal_check_prompt(problem, latest_attempt, language, student_intent)` — loads `goal_reached_check.txt`, injects context.
   - `build_optimal_prompt(problem, student_solution, language)` — loads `optimal_explainer.txt`, injects context.

   Use simple `str.replace()` with clear placeholder tokens like `{{PROBLEM}}`, `{{ATTEMPT}}`, `{{LANGUAGE}}`. No templating libraries needed.

8. Populate `services/gemini_service.py`. Five functions, one per task:
   - `analyse_approach(problem, attempt, language)` — calls Gemini, requests JSON output, parses and returns the dict.
   - `generate_hint(tier, problem, attempt, language, analysis, history)` — calls Gemini with streaming enabled, yields text chunks one by one.
   - `check_goal_reached(problem, latest_attempt, language, student_intent)` — calls Gemini, requests JSON output, returns dict.
   - `explain_optimal(problem, student_solution, language)` — calls Gemini, requests JSON output, returns dict.
   - `generate_visual(problem, algorithm_name, language)` — calls Gemini, requests JSON output, returns dict with HTML string.

   Use LangChain's `ChatGoogleGenerativeAI` for all calls so tracing works later. Keep each function self-contained — no shared state between functions.

9. Populate `routers/chat.py`:
   - `POST /chat/submit` — receives `SubmitAttemptRequest`. Appends the attempt to session. Calls `analyse_approach`. Appends analysis to session. Returns the analysis dict.
   - `GET /chat/hint` (SSE) — receives `session_id` and `tier` as query params. Loads session. Calls `generate_hint` with the requested tier. Streams chunks as SSE events. After streaming completes, appends the full hint to session history. Updates eval counters.
   - `POST /chat/check-goal` — receives `GoalCheckRequest`. Calls `check_goal_reached`. If `goal_reached` is true, updates session. Returns result.
   - `POST /chat/optimal` — receives `session_id`. Calls `explain_optimal`. Updates `optimal_shown` in session. Returns result.

10. Register the chat router in `main.py` with prefix `/chat`.

11. Create `frontend/src/hooks/useSSE.js`:
    - Accepts a URL string.
    - Opens an `EventSource` on that URL.
    - Accumulates text chunks into a `streamedText` string in state.
    - Exposes `{ streamedText, isStreaming, error, reset }`.
    - `reset` clears `streamedText` back to empty (needed between hint requests).

12. Verify end-to-end without the frontend: use curl or `/docs` to submit a Two Sum problem with a brute-force attempt in Python, confirm the analysis JSON returns correctly, then request a tier-1 hint and confirm text streams back to the terminal.

### Phase 3 Summary

Create `phase-summaries/phase-3-summary.md`:

```markdown
# Phase 3 Summary — Prompt Engineering & Hint System

## Prompts written
- For each prompt file: one paragraph on what it does and what the orchestrator approved.

## Functions built
- List each function in gemini_service.py and prompt_builder.py.

## Endpoints built
- List each endpoint in chat.py with its method and path.

## Verification results
- Approach analysis call: [PASS/FAIL] — paste example output.
- Tier 1 hint streaming: [PASS/FAIL]
- Goal check call: [PASS/FAIL]

## Notes
- Any prompt iterations or changes from the original plan.
```

---

## Phase 4 — Frontend UI (Core Screens)

**Goal:** Build the complete working UI. Prioritise clarity and easy future changes over visual complexity.

**Skills to read first:** `/mnt/skills/public/frontend-design/SKILL.md`

### Steps

1. Populate `src/styles/tokens.css` with all CSS custom properties:
   - Background colors (page, card, surface).
   - Text colors (primary, secondary, muted).
   - Accent color (one strong color for interactive elements).
   - Hint tier colors (three distinct but subtle colors for tier 1, 2, 3 badges).
   - Font families (one display font for headings, one mono-style font for code labels).
   - Spacing scale (sm, md, lg, xl).
   - Border radius values.

   Import this file in `main.jsx` so tokens are globally available.

2. Populate `src/constants/index.js`:
   ```js
   export const LANGUAGES = ['python', 'java', 'cpp']

   export const LANGUAGE_LABELS = {
     python: 'Python',
     java: 'Java',
     cpp: 'C++',
   }

   export const HINT_TIERS = [
     { tier: 1, label: 'Subtle hint', description: 'A nudge in the right direction' },
     { tier: 2, label: 'Method hint', description: 'Names the approach category' },
     { tier: 3, label: 'Step-by-step hint', description: 'Walks through the logic in plain English' },
   ]

   export const APP_STATES = {
     INPUT: 'INPUT',
     HINT_LOOP: 'HINT_LOOP',
     OPTIMAL: 'OPTIMAL',
   }
   ```

3. Build `components/CodeEditor.jsx`:
   - Wraps Monaco Editor.
   - Props: `value`, `onChange`, `language` (defaults to `'python'`).
   - Maps `language` prop to Monaco's language identifiers: python → `'python'`, java → `'java'`, cpp → `'cpp'`.
   - Uses a dark theme.
   - Minimum height 200px.
   - No internal state — purely controlled.

4. Build `components/HintTierSelector.jsx`:
   - Renders three buttons, one per tier, using data from `HINT_TIERS` in constants.
   - Props: `onSelect(tier)`, `isLoading`.
   - When `isLoading` is true, disable all buttons and show a loading indicator on the active one.
   - Buttons are clearly labelled and show the tier description as a subtitle.
   - This is the primary way the student chooses their hint depth.

5. Build `components/ProblemInput.jsx`:
   - Props: `onSubmit(problem, attempt, language)`, `isLoading`.
   - Contains: a `<textarea>` for the problem statement, a language selector (dropdown using `LANGUAGES` from constants), and a `CodeEditor` for the attempt.
   - Submit button disabled until both textarea and editor have content.
   - Shows a spinner when `isLoading` is true.
   - Does not call the API itself — calls `onSubmit` and lets `App.jsx` handle the API call.

6. Build `components/HintPanel.jsx`:
   - Props: `analysis`, `streamedHint`, `isStreaming`, `onRequestHint(tier)`, `onSubmitAttempt(attempt)`, `onGoalReached`, `language`.
   - Renders the approach analysis at the top (encouragement + what the student is trying to do).
   - Below that: `HintTierSelector` which calls `onRequestHint(tier)` when a tier is selected.
   - If `streamedHint` has content: displays the hint text (streaming in token by token via the prop).
   - Below the hint: a `CodeEditor` for the student's next attempt.
   - A "Check my solution" button that calls `onSubmitAttempt`.
   - A success banner (hidden by default) that appears when `goal_reached` is true, with a "See optimal approach" button.

7. Build `components/ComparisonView.jsx`:
   - Props: `studentApproach`, `optimalApproach`.
   - `studentApproach` and `optimalApproach` are objects from the optimal explainer JSON.
   - Two-column layout: student side on the left, optimal on the right.
   - Each side shows: approach name, complexity badge, key insight.
   - A `ComplexityBadge` sub-component renders the complexity string with a red background for the worse one and green for the better one.
   - A "Generate visual walkthrough" button at the bottom — calls `onGenerateVisual` prop.

8. Build `components/VisualSandbox.jsx`:
   - Props: `html`, `fallbackText`, `onRegenerate`, `isLoading`.
   - If `html`: render inside `<iframe srcdoc={html} sandbox="allow-scripts" style={{height: '500px', width: '100%'}} />`.
   - If `fallbackText`: render as a numbered list in a styled pre block.
   - If `isLoading`: show a spinner.
   - A "Regenerate" button always visible, calling `onRegenerate`.

9. Build `App.jsx`:
   - Owns all state: `appState` (from `APP_STATES`), `selectedLanguage`, `analysis`, `streamedHint`, `isStreaming`, `optimalData`, `visualData`.
   - Owns all API calls — imports from `api/client.js`.
   - Uses `useSession` hook for session management.
   - Uses `useSSE` hook for hint streaming.
   - Renders the correct component based on `appState`.
   - Handles all state transitions.

10. Add Google Fonts import in `index.html` for the chosen font pair.

11. Test the full flow in the browser: submit a problem → see analysis → select tier-1 hint → hint streams in → submit new attempt → goal check → see comparison. Verify that changing the language in the dropdown changes the Monaco editor language mode.

### Phase 4 Summary

Create `phase-summaries/phase-4-summary.md`:

```markdown
# Phase 4 Summary — Frontend UI

## Components built
- List each component file and what it renders.

## Constants defined
- List what is in constants/index.js.

## Design tokens
- List the CSS custom properties defined in tokens.css.

## Verification results
- Full hint loop in browser: [PASS/FAIL]
- Language switching works: [PASS/FAIL]
- Tier selector works: [PASS/FAIL]
- Streaming renders correctly: [PASS/FAIL]

## Notes
- Any design decisions or layout changes from the plan.
```

---

## Phase 5 — Visual Generator

**Goal:** Generate and safely render algorithm animations in a sandboxed iframe.

**Skills to read first:** `/mnt/skills/public/frontend-design/SKILL.md`

### Steps

1. **Visual Generator prompt** (`prompts/visual_generator.txt`):

   Before writing — explain to the orchestrator:
   > "This prompt asks Gemini to generate a self-contained HTML animation for an algorithm. Gemini receives the problem, the algorithm name, and the student's language. The output is a JSON object with two fields: html (a complete HTML document as a string) and algorithm_name. The HTML must use only inline style and a single vanilla JS script tag — no external libraries. It must include step-forward and step-back buttons, and a panel showing variable state at each step."

   Wait for confirmation. Then write the prompt.

2. Populate `services/visual_validator.py`. One function, clear checks:
   ```python
   def validate_visual_html(html: str):
       # Returns (is_valid: bool, reason: str)
       if '<script src' in html:
           return False, "External script tags not allowed"
       if 'fetch(' in html or 'XMLHttpRequest' in html:
           return False, "Network calls not allowed"
       if 'eval(' in html:
           return False, "eval() not allowed"
       if not all(tag in html for tag in ['<html', '<body', '<script']):
           return False, "HTML is not a complete document"
       if len(html) > 50000:
           return False, "HTML exceeds size limit"
       return True, ""
   ```

3. Add `POST /visual/generate` endpoint to `routers/chat.py`:
   - Receives `{ session_id, algorithm_name }`.
   - Loads session to get the language and problem.
   - Calls `generate_visual(problem, algorithm_name, language)` from gemini_service.
   - Runs `validate_visual_html` on the returned HTML.
   - If valid: returns `{ "html": str, "valid": True }` and updates session eval counters.
   - If invalid: generates a tier-3 text hint as a fallback, returns `{ "fallback_text": str, "valid": False }` and increments `visual_failed` counter.

4. `VisualSandbox.jsx` is already built in Phase 4 — wire it to the visual endpoint in `App.jsx`. The "Generate visual walkthrough" button in `ComparisonView` calls an `onGenerateVisual` prop, which triggers the API call in `App.jsx` and passes the result to `VisualSandbox`.

5. Test with Three algorithms: bubble sort (Python), binary search (Java), two-pointer (C++). Confirm the iframe renders without errors for each.

### Phase 5 Summary

Create `phase-summaries/phase-5-summary.md`:

```markdown
# Phase 5 Summary — Visual Generator

## Prompt written
- Summary of the visual_generator.txt prompt and what the orchestrator approved.

## Validation checks implemented
- List all checks in visual_validator.py.

## Test results
- Bubble sort (Python): [PASS/FAIL — rendered / fell back to text]
- Binary search (Java): [PASS/FAIL]
- Two-pointer (C++): [PASS/FAIL]

## Notes
- How often validation failed. What the fallback text looked like.
```

---

## Phase 6 — Evaluation Logging & Resume-Worthy Features

**Goal:** Add instrumentation and the features that make this stand out on an AI/ML engineering resume.

**Skills to read first:** None required.

### Steps

1. Add `append_eval_log(session)` to `services/session_manager.py`:
   - Receives the full session dict.
   - Appends one row to `evals/session_log.csv` using Python's `csv` module.
   - Fields match the header defined in Phase 1.
   - `problem_hash` is md5 of the problem string — use `hashlib.md5`.

2. Call `append_eval_log` from `routers/chat.py` in two places:
   - When `goal_reached` is set to true in the goal check endpoint.
   - When `POST /chat/optimal` is called (to log `optimal_viewed`).

3. Update the eval counter logic in `routers/chat.py`:
   - When `/chat/hint` is called with tier 1: increment `hints_tier1`.
   - When called with tier 2: increment `hints_tier2`.
   - When called with tier 3: increment `hints_tier3`.
   - Always increment `hints_given`.
   - Use `update_session` with only the counter fields — do not rewrite the whole session.

4. Add `GET /session/{session_id}/eval` to `routers/session.py`:
   - Returns only the `eval_log` dict from the session.

5. Build a `LearningStats` component in the frontend:
   - Props: `evalLog` (the eval_log dict from the session).
   - Displays: total hints requested, breakdown by tier (as a simple bar or number), attempts made.
   - Render it at the bottom of the hint loop screen in `App.jsx`.
   - Style it subtly — it should feel like a status bar, not a main feature.

6. Add LangChain tracing to `services/gemini_service.py`:
   - All Gemini calls already use `ChatGoogleGenerativeAI` from Phase 3.
   - Add `LANGCHAIN_TRACING_V2=true` and `LANGCHAIN_API_KEY` to `.env.example` as optional.
   - When these env vars are set, LangChain automatically sends traces to LangSmith — no code changes needed beyond having the env vars present.
   - Add a comment in `gemini_service.py` explaining this so the orchestrator knows how to enable it.

7. Add a `ComplexityBadge` component if not already built in Phase 4:
   - Props: `complexity` (string like "O(n²)"), `isBetter` (bool).
   - Green background if `isBetter`, red if not.
   - Renders the complexity string with appropriate contrast text color.

8. Write `README.md` at the project root:
   - Two-sentence project description.
   - ASCII architecture diagram showing: Browser → React → FastAPI → Gemini + Redis.
   - Setup instructions: clone, create `.env`, pip install, npm install, run both servers.
   - "How it works" section explaining the hint tier system and student-controlled flow.
   - Tech stack table from SPEC.md.
   - Note about LangSmith tracing being optional.

### Phase 6 Summary

Create `phase-summaries/phase-6-summary.md`:

```markdown
# Phase 6 Summary — Evaluation Logging & Resume Features

## Logging
- Confirm session_log.csv is being appended correctly — paste one example row.

## LangSmith tracing
- Is it configured? [YES/NO]
- What env vars are needed to enable it?

## Components added
- LearningStats: what it displays.
- ComplexityBadge: how it determines color.

## README
- Confirm README.md is complete and accurate.

## Notes
- Any issues with CSV appending or counter logic.
```

---

## Phase 7 — Deployment & Polish

**Goal:** Deploy to production, harden the app, make it demo-ready.

**Skills to read first:** None required.

### Steps

1. Add `render.yaml` to the `backend/` directory:
   ```yaml
   services:
     - type: web
       name: dsa-companion-api
       runtime: python
       buildCommand: pip install -r requirements.txt
       startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
       envVars:
         - key: GEMINI_API_KEY
           sync: false
         - key: UPSTASH_REDIS_REST_URL
           sync: false
         - key: UPSTASH_REDIS_REST_TOKEN
           sync: false
         - key: FRONTEND_URL
           sync: false
         - key: SESSION_TTL_SECONDS
           value: "3600"
   ```

2. Update `config.py` to read `PORT` from environment:
   ```python
   PORT = int(os.getenv("PORT", 8000))
   ```

3. Add `vercel.json` to the `frontend/` directory:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

4. Add rate limiting to `main.py` using `slowapi`:
   - Limit `GET /chat/hint` (the SSE endpoint) to 30 requests per minute per IP.
   - On rate limit exceeded, return HTTP 429 with a plain message.
   - This is already in `requirements.txt` from Phase 1.

5. Add a cold-start banner to the frontend. In `App.jsx`:
   - When any API call takes more than 2.5 seconds, show a small banner: "Waking up the server — this takes ~30 seconds on first load."
   - Use a `setTimeout` that sets a `showColdStartBanner` state to true after 2500ms, and clears it when the response arrives.

6. Add a top-level error boundary in React. Create `src/ErrorBoundary.jsx`:
   - A simple class component that catches render errors.
   - Displays: "Something went wrong. Please refresh the page."
   - Wrap `<App />` in `<ErrorBoundary>` in `main.jsx`.

7. Add `.catch` handlers to every API call in `api/client.js`:
   - Return a standardised error object: `{ error: true, message: string }`.
   - Components check for `result.error` and show a user-facing message — never log raw error objects to the UI.

8. Deploy backend to Render:
   - Push the repo to GitHub.
   - Create a new Web Service on Render, point it at the repo's `backend/` directory.
   - Set all environment variables in the Render dashboard.
   - Confirm `GET /health` returns 200 on the live Render URL.

9. Deploy frontend to Vercel:
   - Create a new project on Vercel, set the root directory to `frontend/`.
   - Set `VITE_API_BASE_URL` to the live Render URL.
   - Confirm the app loads and creates a session without errors.

10. End-to-end production test:
    - Submit "Two Sum" with a brute-force Python solution.
    - Request all three hint tiers one by one.
    - Submit an improved solution, trigger the goal check.
    - View the optimal comparison.
    - Generate a visual and confirm it renders in the iframe.
    - Confirm a row appears in `evals/session_log.csv`.

11. Record a 2-minute screen recording of the full flow. Save a note about it in `evals/demo.md`.

### Phase 7 Summary

Create `phase-summaries/phase-7-summary.md`:

```markdown
# Phase 7 Summary — Deployment & Polish

## Deployment URLs
- Backend (Render): [URL]
- Frontend (Vercel): [URL]

## Production test results
- Session creation: [PASS/FAIL]
- Approach analysis: [PASS/FAIL]
- Tier 1 hint streaming: [PASS/FAIL]
- Tier 2 hint streaming: [PASS/FAIL]
- Tier 3 hint streaming: [PASS/FAIL]
- Goal check: [PASS/FAIL]
- Optimal view: [PASS/FAIL]
- Visual generation: [PASS/FAIL]
- Eval log row written: [PASS/FAIL]

## Rate limiting
- Confirmed working: [YES/NO]

## Cold start banner
- Appears correctly: [YES/NO]

## Demo recording
- Location/link noted in evals/demo.md: [YES/NO]

## Notes
- Any production-only issues encountered.
```
