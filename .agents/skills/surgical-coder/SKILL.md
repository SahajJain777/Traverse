---
name: surgical-coder
description: Scope implementation to a single file at a time, ensuring careful planning and strict alignment with the architecture ledger.
license: MIT
metadata:
  category: development
---

# Surgical Coder

The Surgical Coder skill promotes highly scoped, precise code changes. Instead of attempting broad, multi-file updates that can cause regression, it guides the developer to modify single files meticulously.

## Knowledge

"Surgical" coding requires understanding the blast radius of changes. Modifying files one-by-one, testing at each step, and documenting the scope of each change ensures clean, readable, and highly maintainable systems.

## Instructions

1. **Review Ledger**: Before editing or creating any file, check the `PROJECT_STATE.md` (Architecture Ledger) to ensure alignment with the latest schemas, rules, and stack requirements.
2. **Formulate a Scope**: Determine the exact file that needs modification or creation (`file_path`). Identify the primary single responsibility (`purpose`) of this file.
3. **Explain Plan**: Explain your planned changes to the orchestrator and seek confirmation before writing the code.
4. **Write Scoped Code**: Create or modify the file with precise, clean, junior-readable code that accomplishes the stated purpose. Do not make unrelated changes to other files in the same operation.
