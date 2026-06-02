# Project Architecture Ledger

This document acts as the single source of truth for the project's technical specifications, architecture decisions, and global rules. Agents must read and adhere to this document before making any changes.

---

## Tech Stack

| Layer | Technology | Hosting / Context |
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

## Schemas

### Session State Schema (Redis JSON Blob)

Stored under the key: `session:{session_id}`

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

---

## Environment Variables

```env
GEMINI_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
FRONTEND_URL=https://your-app.vercel.app
SESSION_TTL_SECONDS=3600
LANGCHAIN_API_KEY=          # optional, for LangSmith tracing
```

---

## Global Rules

### Agent Coding Guidelines
1. **Write code the way a human developer would.** No over-engineered abstractions. No unnecessary design patterns. If a junior developer would be confused by the structure, simplify it.
2. **Keep functions short and single-purpose.** One function does one thing. If a function is getting long, split it.
3. **Use plain, readable variable names.** No abbreviations unless universally understood (e.g. `id`, `url`).
4. **No premature optimisation.** Write the obvious solution first. Only complicate it if there is a clear, concrete reason.
5. **Comments explain "why", not "what".** Do not comment on what the code obviously does. Comment only on non-obvious decisions.
6. **For prompts specifically:** Before writing any prompt file, the agent must stop and present the orchestrator (the human) with a plain-English summary of: what this prompt is trying to achieve, what context Gemini will receive, and what format the output should be in. Wait for confirmation before writing the prompt content.

### Frontend Architecture Rules
1. **All API calls live only in `src/api/client.js`.** No `fetch` or `axios` calls anywhere else in the codebase.
2. **All hardcoded strings (labels, button text, tier names) live only in `src/constants/index.js`.** Changing a label means editing one line in one file.
3. **All CSS custom properties (colors, spacing, fonts, radii) live only in `src/styles/tokens.css`.** Changing the visual theme means editing one file.
4. **Each component is self-contained.** A component receives props and renders. It does not fetch data directly (that goes in hooks or `App.jsx`).
5. **`App.jsx` owns the screen state and three-panel orchestration.** The viewports are split 50% left / 50% right. Right side is split 55% top / 45% bottom. The parent shell is strictly `100vh` with `overflow: hidden`.
6. **Monaco theme must be light.** Light background matches the white UI aesthetic. Monaco is flush to its boundaries.
7. **Goal success triggers celebration overlays and auto-transitions.** Upon `goal_reached` becoming true, a CSS ribbon animation cascades from the top for 2.2s. At 2.4s, the bottom right panel transitions to showing the comparison view automatically.
8. **Language selection is a top-level prop.** The selected language (Python / Java / C++) is stored in `App.jsx` state and passed down as a prop. No component figures out the language on its own.
