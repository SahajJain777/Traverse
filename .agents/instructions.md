# Repository Rules and Instructions for AI Agents

Welcome! This repository is configured to be developed by autonomous AI agents. To ensure consistency, safety, and alignment with human intent, you must strictly follow these instructions and utilize the configured project skills.

---

## 1. Project Reference Files
Before starting any task, read these foundational documents in the root directory:
- [SPEC.md](file:///Users/sahaj/Desktop/DSA%20Mastery/SPEC.md): Technical requirements, stack, database schemas, and folder structure.
- [PLAN.md](file:///Users/sahaj/Desktop/DSA%20Mastery/PLAN.md): 7-phase execution roadmap. You must execute phases sequentially.
- [PROJECT_STATE.md](file:///Users/sahaj/Desktop/DSA%20Mastery/PROJECT_STATE.md): The live Architecture Ledger.

---

## 2. Using Project Skills
This workspace provides three custom skills inside `.agents/skills/`. You are expected to read their guidelines and behave accordingly:

### A. Context Scribe (`context-scribe`)
- **When**: At the conclusion of every phase (phases 1-7) in [PLAN.md](file:///Users/sahaj/Desktop/DSA%20Mastery/PLAN.md).
- **Behavior**: You must stop coding, compile phase files, test verification status, write a phase summary under `phase-summaries/phase-X-summary.md`, and request explicit human approval before proceeding.

### B. Architecture Ledger (`architecture-ledger`)
- **When**: Before implementing any code change that introduces or modifies a fundamental schema, environment variable, dependency, or architectural rule.
- **Behavior**: Update the appropriate section of [PROJECT_STATE.md](file:///Users/sahaj/Desktop/DSA%20Mastery/PROJECT_STATE.md) first, including a clear justification.

### C. Surgical Coder (`surgical-coder`)
- **When**: Throughout all coding tasks.
- **Behavior**: Restrict your code changes to a single file at a time. Explain your change plan and target scope clearly before modifying the code.

---

## 3. Strict Coding Guidelines
1. **Human-like Simplicity**: Write clean, basic, understandable code. No complex or nested design patterns.
2. **Short, Single-Purpose Functions**: Keep functions focused.
3. **No Abbreviations**: Use descriptive, readable variable names.
4. **No Premature Optimization**: Focus on functionality first.
5. **Prompt Creation Protocol**: Before writing any `.txt` file inside `prompts/`, explain to the human orchestrator:
   - What the prompt intends to achieve.
   - What context Gemini receives.
   - What the output format will be.
   - **Wait for explicit approval** before creating the file.
