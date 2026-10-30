---
name: improve-ai-context
description: Update QuizCred AI context harness after corrections or repeated agent mistakes. Use when the user asks to improve agent docs, when you were wrong about repo behavior, or when the same confusion happens twice.
---

# Improve AI context harness

## When to use

- User says context/docs/rules are wrong or incomplete
- You mis-located logic, API shape, or credit rules
- A second session hits the same pitfall

## Steps

1. **Identify the fact** — one sentence, verifiable (file path or README section).
2. **Log** — append to `.cursor/context/LEARNINGS.md`:
   `- **YYYY-MM-DD** — <fact> (@optional/path)`
3. **Promote if recurring** — choose the smallest edit:
   - Table row in root `AGENTS.md` “Where to look”
   - Bullet in `backend/AGENTS.md` or `frontend/AGENTS.md`
   - New or updated `.cursor/rules/*.mdc` with correct `globs` / `description`
4. **Avoid bloat** — no generic ESLint/Prettier advice; no large code copies.
5. **Tell the user** what you updated and why.

## Do not

- Edit `~/.cursor/skills-cursor/` (Cursor built-ins)
- Replace README domain docs—cross-link instead

## Reference

- Index: `.cursor/CONTEXT-HARNESS.md`
- Domain truth: `README.md` (credits, API map, concurrency)
