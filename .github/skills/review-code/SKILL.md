---
name: review-code
description: Use when reviewing a diff against the project rules. The review-staged, review-branch, and review-pr skills load this one.
---
# Code review

Review only the changed lines. Check them against [copilot-instructions.md](../../copilot-instructions.md), and against [vitest.instructions.md](../../instructions/vitest.instructions.md) for `*.spec.ts` files.

## Checks

- Architecture: for a changed file under a folder with an `architecture.instructions.md`, check the file against that `architecture.instructions.md`. Treat its rules as `blocker` unless they say otherwise.
- TypeScript: type assertions, `any`, `@ts-ignore`, default exports, anonymous functions, missing return types on exports, missing `src/index.ts` re-exports.
- Tests: a changed source file lacks matching spec updates, or a spec breaks a Vitest rule.
- Commits: Conventional Commits format, imperative lowercase description, correct `!` for breaking changes.
- Files: hand edits to `CHANGELOG.md`.
- Style: comments and docs use passive voice or a needless form of "to be". Report these as `nit` only.
- Correctness: bugs, unhandled branches, new dependencies that an existing one could replace.

## Output

List findings by file, then line, as `path:line – severity – issue – fix`. Use the line number in the new version of the file. For a deleted line, use the nearest remaining line. Use severities `blocker`, `warning`, and `info`. Skip praise and summaries. If nothing fails a check, write "No findings."