<!-- TRELLIS:START -->
# Trellis Instructions

These instructions are for AI assistants working in this project.

This project is managed by Trellis. The working knowledge you need lives under `.trellis/`:

- `.trellis/workflow.md` — development phases, when to create tasks, skill routing
- `.trellis/spec/` — package- and layer-scoped coding guidelines (read before writing code in a given layer)
- `.trellis/workspace/` — per-developer journals and session traces
- `.trellis/tasks/` — active and archived tasks (PRDs, research, jsonl context)

If a Trellis command is available on your platform (e.g. `/trellis:finish-work`, `/trellis:continue`), prefer it over manual steps. Not every platform exposes every command.

If you're using Codex or another agent-capable tool, additional project-scoped helpers may live in:
- `.agents/skills/` — reusable Trellis skills
- `.codex/agents/` — optional custom subagents

Managed by Trellis. Edits outside this block are preserved; edits inside may be overwritten by a future `trellis update`.

<!-- TRELLIS:END -->

# Project Rules

## Tech Stack

- Frontend: Next.js + React + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Database: PostgreSQL
- Deployment: Docker Compose
- Reverse proxy: Caddy / Nginx
- Package manager: pnpm

Prefer the existing stack. Do not introduce alternative frameworks or duplicate libraries without a clear reason.

## Development

Before coding:

1. Read the relevant `.trellis/spec/`.
2. Inspect existing code and reuse existing components/utilities.
3. Prefer the smallest change that solves the task.

After coding:

1. Run typecheck/lint/tests when available.
2. Build the project when relevant.
3. Fix errors introduced by the change.
4. Do not claim completion without validation.

## Rules

- Keep code simple and readable; avoid unnecessary abstraction.
- Do not use `any` unless unavoidable.
- Never commit passwords, API keys, tokens, or `.env`.
- Do not hard-code secrets or production configuration.
- Keep desktop and mobile layouts usable.
- Do not expose databases directly to the public network.
- Persistent data must use Docker volumes or external storage.
- Do not modify unrelated code while completing a task.

# Agent Ownership

OpenCode owns:
- `frontend/**`

Codex owns:
- `backend/**`
- `infra/**`
- `contracts/**`

`reference/cati_me_source/**` is read-only design and interaction reference.

Do not modify files owned by another agent unless the task explicitly requires it.

Backend API changes must update `contracts/openapi.json`.

Frontend must follow the API contract and must not invent backend fields or endpoints.
