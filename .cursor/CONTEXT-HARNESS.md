# Self-improving AI context harness

Documentation-as-code so Cursor (and other agents) stay accurate on **QuizCred** without re-discovering the repo every session.

## Layers

| Layer | Path | Role |
|-------|------|------|
| Root instructions | `AGENTS.md` | Always-on map: commands, architecture, canonical files |
| Scoped instructions | `backend/AGENTS.md`, `frontend/AGENTS.md` | Deeper rules when working in one app |
| Project rules | `.cursor/rules/*.mdc` | Short, scoped constraints (globs / always apply) |
| Learnings log | `.cursor/context/LEARNINGS.md` | Append-only facts from real sessions |
| Maintenance skill | `.cursor/skills/improve-ai-context/SKILL.md` | Workflow to update the harness |
| Verifier subagent | `.cursor/agents/verifier.md` | Post-task check against credit/auth/API invariants |
| Human runbook | `README.md` | Credits, deploy, interview guide (source of truth for domain) |

Rules apply to **Agent (Chat)**. They are version-controlled—commit harness updates with the code they describe.

## Improvement loop

```text
Agent works on task
    → hits confusion or user corrects a assumption
    → append LEARNINGS.md (dated, one line)
    → if recurring: edit AGENTS.md or add/split a .mdc rule (<50 lines)
    → reference @files instead of duplicating code
    → commit in same PR when possible
```

**When to update**

- Same mistake twice in one area → new or updated rule with `globs`.
- One-off quirk → LEARNINGS only.
- New module or route family → line in AGENTS.md “Where to look” table.
- API contract change → README API map + backend rule reminder if needed.

**When not to update**

- Generic language/style advice already covered by linters.
- Huge pasted snippets (link to files).

## Adding rules

Create `.cursor/rules/name.mdc`:

```yaml
---
description: One line for the rule picker
globs: backend/src/**/*.ts   # optional
alwaysApply: false
---
```

Use `/create-rule` in Cursor or copy an existing `.mdc` file. Keep one concern per file.

## Adding skills

Project skills live in `.cursor/skills/<name>/SKILL.md`. Use for multi-step workflows (dev stack, harness maintenance). See `improve-ai-context` as a template.

## Verification

After harness edits, ask the agent a question that previously failed (e.g. “Where is stake applied?”) and confirm it cites `ledger.ts` / README without guessing.
