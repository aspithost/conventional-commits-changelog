---
name: review-code
description: Use when reviewing a diff against the project rules. The review-staged, review-branch, and review-pr skills load this one.
---
# Code review

Review only the changed lines. Check them against [copilot-instructions.md](../../copilot-instructions.md), and against [vitest.instructions.md](../../instructions/vitest.instructions.md) for `*.spec.ts` files.

## Checks

- TypeScript: type assertions, `any`, `@ts-ignore`, default exports, anonymous functions, missing return types on exports, missing `src/index.ts` re-exports.
- Tests: a changed source file lacks matching spec updates, or a spec breaks a Vitest rule.
- Commits: Conventional Commits format, imperative lowercase description, correct `!` for breaking changes.
- Files: hand edits to `CHANGELOG.md`.
- Style: comments and docs use passive voice or a form of "to be".
- Correctness: bugs, unhandled branches, new dependencies that an existing one could replace.

## Output

List findings by file, then line, as `path:line – severity – issue – fix`. Use severities `blocker`, `warning`, and `nit`. Skip praise and summaries. If nothing fails a check, write "No findings."