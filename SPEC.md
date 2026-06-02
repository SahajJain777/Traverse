# DSA Learning Companion — Project Specification

## Product Overview

An AI-powered DSA tutoring platform that guides students toward algorithmic understanding through progressive hints, not solutions. The AI reads the student's attempted solution, understands their thinking, and nudges them forward — never giving away the answer directly.

---

## Core Philosophy

- The student must always submit an attempt before receiving help.
- The system guides, never solves.
- Visual dry-runs make abstract logic concrete.
- The student's own approach is validated first before the optimal path is introduced.
- **The student is in full control of hint depth.** The system never forces a tier — the student chooses when they want a stronger hint.

---

## Agent Coding Guidelines

 These rules apply to every file written during this project. AI agents must follow them without exception.

1. **Write code the way a human developer would.** No over-engineered abstractions. No unnecessary design patterns. If a junior developer would be confused by the structure, simplify it.
2. **Keep functions short and single-purpose.** One function does one thing. If a function is getting long, split it.
3. **Use plain, readable variable names.** No abbreviations unless universally understood (e.g. `id`, `url`).
4. **No premature optimisation.** Write the obvious solution first. Only complicate it if there is a clear, concrete reason.
5. **Comments explain "why", not "what".** Do not comment on what the code obviously does. Comment only on non-obvious decisions.
6. **For prompts specifically:** Before writing any prompt file, the agent must stop and present the orchestrator (the human) with a plain-English summary of: what this prompt is trying to achieve, what context Gemini will receive, and what format the output should be in. Wait for confirmation before writing the prompt content.

---

## Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React + Vite + TailwindCSS | Vercel (free tier) |
| Code Editor | Monaco Editor (React component) | bundled |
| Backend | FastAPI (Python) | Render (free tier) |
| AI Brain | Gemini 1.5 Pro | Google AI Studio API |
| Python AI SDK | `google-generativeai` | pip package |
| Prompt Chaining | LangChain (Python) | pip package |
| Session State | Upstash Redis | Upstash free tier |
| Visual Sandbox | `<iframe srcdoc>` | client-side isolation |
| Streaming | Server-Sent Events (SSE) via FastAPI | — |

---

## Supported Languages

Students can submit code in the following languages. The Monaco Editor language and Gemini prompts must handle all three:

- Python
- Java
- C++

The language selected by the student is stored in the session and sent with every prompt so Gemini can give language-aware hints.

---

## Repository Structure

```
dsa-companion/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # env vars, constants
│   ├── requirements.txt
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── session.py           # session create/get endpoints
│   │   └── chat.py              # hint generation + visual endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gemini_service.py    # all Gemini API calls
│   │   ├── prompt_builder.py    # loads prompts and injects variables
│   │   ├── session_manager.py   # Redis read/write helpers
│   │   └── visual_validator.py  # generated code safety check
│   └── models/
│       ├── __init__.py
│       └── schemas.py           # Pydantic request/response models
│
├── frontend/
│   ├── src/
│   │   ├── components/          # one file per UI component, no exceptions
│   │   │   ├── ProblemInput.jsx
│   │   │   ├── HintPanel.jsx
│   │   │   ├── HintTierSelector.jsx   # student-controlled tier UI
│   │   │   ├── VisualSandbox.jsx
│   │   │   ├── ComparisonView.jsx
│   │   │   └── CodeEditor.jsx
│   │   ├── hooks/
│   │   │   ├── useSession.js
│   │   │   └── useSSE.js
│   │   ├── api/
│   │   │   └── client.js        # all API calls live here, nowhere else
│   │   ├── constants/
│   │   │   └── index.js         # hint tier labels, language options, UI strings
│   │   ├── styles/
│   │   │   └── tokens.css       # all CSS custom properties in one place
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
├── prompts/                      # all system prompt templates as plain .txt files
│   ├── approach_analyser.txt
│   ├── hint_tier_1.txt
│   ├── hint_tier_2.txt
│   ├── hint_tier_3.txt
│   ├── goal_reached_check.txt
│   ├── optimal_explainer.txt
│   └── visual_generator.txt
│
├── evals/
│   └── session_log.csv
│
├── phase-summaries/              # auto-generated after each phase
│   ├── phase-1-summary.md
│   ├── phase-2-summary.md
│   └── ... (one per phase)
│
├── .env.example
└── README.md
```

---

## Frontend Architecture Rules

The frontend is designed to be easy to change. These rules must be followed so that future UI changes can be made by editing one file, not hunting across many.

1. **All API calls live only in `src/api/client.js`.** No `fetch` or `axios` calls anywhere else in the codebase.
2. **All hardcoded strings (labels, button text, tier names) live only in `src/constants/index.js`.** Changing a label means editing one line in one file.
3. **All CSS custom properties (colors, spacing, fonts, radii) live only in `src/styles/tokens.css`.** Changing the visual theme means editing one file.
4. **Each component is self-contained.** A component receives props and renders. It does not fetch data directly (that goes in hooks or `App.jsx`).
5. **`App.jsx` owns the screen state.** Which screen is showing (Input / Hint Loop / Optimal) is controlled only in `App.jsx`, not inside individual components.
6. **Language selection is a top-level prop.** The selected language (Python / Java / C++) is stored in `App.jsx` state and passed down as a prop. No component figures out the language on its own.

---

## Hint Tier System

The student chooses the hint tier themselves via the UI. The system does not automatically escalate tiers.

| Tier | Behaviour |
|---|---|
| 1 | Direction only — no method revealed. Points at what to think about. A guiding question. |
| 2 | Method nudge — names the algorithmic category (e.g. "two pointers") without explaining it. |
| 3 | Near-solution — explains the exact steps in plain English. Still no code. |

- The student sees three clearly labelled buttons: "Subtle hint", "Method hint", "Step-by-step hint".
- Each button triggers `GET /chat/hint` with the chosen tier number in the request.
- The backend uses whichever tier is in the request — it does not override the student's choice.
- The session records which tiers were used for eval logging.

---

## Backend API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/session/create` | Create new session, return session_id |
| GET | `/session/{session_id}` | Fetch current session state |
| POST | `/chat/submit` | Submit problem + attempt, get approach analysis |
| GET | `/chat/hint` (SSE) | Stream hint for the tier the student requested |
| POST | `/chat/check-goal` | Ask Gemini if student has reached their approach goal |
| POST | `/chat/optimal` | Trigger optimal solution explanation |
| POST | `/visual/generate` | Generate animation code for an algorithm |
| GET | `/health` | Health check for Render uptime monitoring |

---

## Session State Schema (Redis)

Each session is stored as a JSON blob under key `session:{session_id}`:

```json
{
  "session_id": "uuid",
  "problem": "string",
  "language": "python",
  "attempts": ["string", "string"],
  "hint_count": 0,
  "goal_reached": false,
  "optimal_shown": false,
  "conversation_history": [
    { "role": "user", "content": "string" },
    { "role": "model", "content": "string" }
  ],
  "created_at": "ISO timestamp",
  "eval_log": {
    "hints_given": 0,
    "tiers_used": [],
    "goal_iterations": 0
  }
}
```

Note: `hint_tier` is no longer stored on the session. The tier comes from the student's request each time.

---

## Visual Generator Spec

- Gemini is prompted to return a **single self-contained HTML string**.
- The HTML must use only inline `<style>` and a single `<script>` tag.
- No external CDN imports allowed in generated code.
- The backend `visual_validator.py` checks for: external script tags, `fetch`/`XMLHttpRequest` calls, `eval()` usage, and missing required HTML tags.
- If validation fails, the backend returns a plain-text step-by-step dry-run fallback instead.
- The frontend renders valid HTML inside `<iframe srcdoc>` with `sandbox="allow-scripts"`.

---

## Evaluation Logging

Every completed session appends one row to `evals/session_log.csv`:

```
session_id, problem_hash, language, total_attempts, hints_tier1, hints_tier2, hints_tier3, goal_reached, optimal_viewed, visual_generated, visual_failed
```

---

## Environment Variables

```
GEMINI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
FRONTEND_URL=https://your-app.vercel.app
SESSION_TTL_SECONDS=3600
LANGCHAIN_API_KEY=          # optional, for LangSmith tracing
```

---

## Key Constraints & Rules

1. A student cannot request a hint without first submitting a problem and an attempt.
2. The student chooses the hint tier — the backend never overrides this choice.
3. Gemini is never called without a fully constructed system prompt from `prompt_builder.py`.
4. The full conversation history is sent to Gemini on every call — no stateless calls.
5. The selected language is included in every prompt sent to Gemini.
6. Visual generation is always async and non-blocking — it never holds up hint delivery.
7. All Gemini responses for analysis and goal checking use structured JSON output.
8. The frontend never stores conversation history — all state lives in Redis.
9. CORS is locked to the Vercel frontend URL in production.
10. Prompts are never written without first getting confirmation from the orchestrator on the approach.
