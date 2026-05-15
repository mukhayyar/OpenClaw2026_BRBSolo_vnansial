# Contributing to Vnansial

Vnansial is open source under Apache 2.0. We want the codebase to stay
welcoming to humans *and* AI agents. The rules below keep the bar
consistent.

## Before you start
1. Read `CLAUDE.md` (canonical) or `AGENTS.md` (TL;DR) for design rules.
2. Read `ARCHITECTURE.md` for the data flow.
3. Check `.plan/00-index.plan` to see if your change is already planned.
4. Open an issue / discussion to align — especially for new pages, new
   external APIs, or new agent tools.

## Branch & commit
- Branch from `main`. Name: `feat/<short>`, `fix/<short>`, or
  `chore/<short>`.
- Commits: imperative present tense, no AI signature in trailer (we don't
  require Co-Authored-By). Reference the plan file when relevant:
  `feat(crypto): add risk heuristic (super-platform.plan §3)`.

## Code standards
- Indonesian for user-facing strings, English for identifiers/comments.
- No new UI libraries. Tailwind v4 + Framer Motion only.
- Tools must return `{ error }` instead of throwing.
- Always include a `disclaimer` in financial tool output.

## Tests
- `npm test` must pass on `main`.
- New server tools need at least one happy-path vitest in
  `tests/server/<domain>.test.js`.
- UI changes: smoke-check at minimum (no headless e2e required yet).

## Plan-driven workflow
We track in-flight work in `.plan/*.plan` and `.progress/*.progress`. When
you start a non-trivial change:
1. Write/append a `.plan/<your-feature>.plan` with goal, why, phases.
2. Add a matching `.progress/<your-feature>.progress` checklist.
3. Update `.plan/00-index.plan` (the registry).
4. Tick checkboxes as you ship.

This is how AI agents (Claude, Cursor, Aider, Gemini, …) hand work off to
each other and to humans.

## Pull requests
- Small PRs preferred (~< 500 lines, one concern).
- Link the relevant `.plan` file in the description.
- Include screenshots for UI changes (Apple-style, please).
- Wait for CI green before merging.

## Reporting issues
- Bugs: include OS, Node version, `npm run dev` log, and screenshots.
- Security: do *not* file public issues. Email maintainer or DM via the
  contact in `README.md`.

## Working with the AI Assistant
The agent uses tool-calling. When you add a tool:
- Add the wrapper in `server/tools/runner.js`.
- Add the schema in `server/tools/definitions.js`.
- Update `server/agent/systemPrompt.js` to mention the new capability.

The `runAgentChat` loop caps iterations at 8 to prevent infinite tool
loops — keep that invariant in mind.
