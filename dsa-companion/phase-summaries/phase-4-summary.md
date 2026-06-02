# Phase 4 Summary — Frontend UI (Core Screens)

## Components built

| File | Description |
|------|-------------|
| `src/styles/tokens.css` | Full design system: colors, fonts, spacing, radii, shadows, transitions — 45 CSS custom properties |
| `src/components/ProblemInput.jsx` | Initial problem entry screen — textarea, language dropdown, Monaco/plain-text toggle, submit button |
| `src/components/CodeEditor.jsx` | Monaco Editor wrapper — dark theme, language-mapping (python/java/cpp), controlled component |
| `src/components/HintTierSelector.jsx` | Three tier buttons (Subtle / Method / Step-by-step) with descriptions and loading spinners |
| `src/components/HintPanel.jsx` | Main hint loop — analysis card, tier selector, streaming hint display, next-attempt editor, goal check + success banner |
| `src/components/ComparisonView.jsx` | Two-column student vs optimal approach comparison with complexity badges and generate-visual button |
| `src/components/VisualSandbox.jsx` | Sandboxed iframe for algorithm animations — renders srcdoc HTML, shows fallback text or loading spinner |
| `src/App.jsx` | State owner — manages screen transitions (INPUT → HINT_LOOP → OPTIMAL), all API calls, SSE hint streaming, cold start banner |

## Constants (in `src/constants/index.js`)
- `LANGUAGES`, `LANGUAGE_LABELS` — Python, Java, C++
- `HINT_TIERS` — tier definitions with labels and descriptions
- `APP_STATES` — INPUT, HINT_LOOP, OPTIMAL

## Design tokens
- Backgrounds: page (`#f8f9fb`), card (`#ffffff`), surface (`#f1f3f5`), code (`#1e1e2e`)
- Accent: indigo (`#6c63ff`)
- Hint tiers: green (tier 1), yellow (tier 2), red (tier 3)
- Fonts: Inter (display), JetBrains Mono (code)
- Google Fonts imported in `index.html`, tokens.css imported in `main.jsx`

## Changes made during review
- **Language lifted to top-level state** — `selectedLanguage` lives in `App.jsx`, passed as props to `ProblemInput` and `HintPanel`
- **ComparisonView data fix** — was receiving the wrong object (analysis instead of optimal explainer response); now uses single `optimalData` prop from the optimal endpoint response directly
- **SSE timing fix** — removed fragile `setTimeout(50ms)`; `useEffect` now calls `resetSSE()` then `startSSE()` synchronously
- **`SubmitAttemptRequest.problem` made optional** — backend Pydantic model defaults to `""`, endpoint only overwrites stored problem if non-empty
- **Duplicate state removed** from ProblemInput.jsx (build fix)

## Verification results
- **Frontend build:** PASS — 109 modules, 754ms build time
- **Backend import:** PASS — all modules import cleanly

## Notes
- The backend and frontend are now fully wired for the complete flow: submit → analysis → hint streaming → goal check → optimal comparison → visual generation
- Cold start banner shows after 2.5s if API is slow (Render free tier cold start)
