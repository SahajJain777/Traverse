---
name: context-scribe
description: Write a structured phase summary at the conclusion of a build phase to track progress and get approval before proceeding.
license: MIT
metadata:
  category: development
---

# Context Scribe

The Context Scribe skill defines a structured workflow for summarizing completed project phases. It ensures a clear trail of changes, verification status, and notes, acting as a quality gate before starting the next phase of development.

## Knowledge

Maintaining a clean state and clear phase transitions prevents drift and ensures that the agent and the orchestrator remain fully aligned. A phase summary documents exactly what changed, what tests or manual checks passed, and any lessons learned or deviations from the design.

## Instructions

1. **Stop Coding**: At the end of every build phase, immediately stop coding and do not proceed to the next phase.
2. **Gather Phase Details**: Collect the following details:
   - Phase number (1-7)
   - List of files created or significantly modified during this phase
   - Verification results (a clear PASS/FAIL report of steps verified in the browser, terminal, or via API)
   - Notes on any deviations or potential issues
3. **Generate Summary**: Write a structured phase summary document or message in markdown containing:
   - **Phase Number**: The current phase number.
   - **Files Created/Modified**: Clear absolute or relative links to the files.
   - **Verification Report**: Test/validation results showing full success.
   - **Phase Notes**: Rationale for design deviations or specific observations.
4. **Request Approval**: Present the summary to the orchestrator and wait for explicit approval before starting the next phase.
