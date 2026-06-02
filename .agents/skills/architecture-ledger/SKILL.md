---
name: architecture-ledger
description: Update the PROJECT_STATE.md file to maintain a single source of truth for architectural details, schemas, environment variables, and global rules.
license: MIT
metadata:
  category: architecture
---

# Architecture Ledger

The Architecture Ledger skill ensures the agent maintains a single source of truth for state and architectural decisions before writing any code. It guards against codebase drift and ensures architectural compliance.

## Knowledge

A project's state is defined in the `PROJECT_STATE.md` file, which includes the Tech Stack, database/API Schemas, Environment Variables, and Global Rules. Keeping this ledger synchronized with the actual project decisions prevents out-of-date documentation and coding errors.

## Instructions

1. **Identify Modifications**: Whenever a fundamental schema, environment variable, or architectural rule is modified or added, pause implementation.
2. **Determine Section**: Choose the appropriate section in `PROJECT_STATE.md` to update:
   - Tech Stack
   - Schemas
   - Environment Variables
   - Global Rules
3. **Update the Ledger**: Edit the `PROJECT_STATE.md` file to inject the new state content accurately. Ensure that this ledger update is written *before* implementing any code changes that depend on it.
4. **Provide Justification**: Document a clear explanation of why this architectural or state change occurred inside the file or commit message.
