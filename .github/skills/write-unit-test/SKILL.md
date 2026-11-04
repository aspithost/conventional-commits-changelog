---
name: write-unit-test
description: Use when asked to write, add, or update Vitest unit tests for a TypeScript source file, or when a source file has no colocated .spec.ts.
---
Write Vitest unit tests for the file the user names. If the user names none, use the file open in the editor.

1. Read [Vitest instructions](../../instructions/vitest.instructions.md).
2. Read the source file. List every exported function, branch, and collaborator.
3. If the source folder has an `architecture.instructions.md`, read it and test its rules.
4. Extend `<source>.spec.ts` if it exists and keep its passing tests. Otherwise create it.
5. Run `npx vitest run <spec file>` and fix failing tests. Never use `npm run test:unit`, because it starts watch mode.
6. If a failure reveals a source bug, leave the source unchanged. Mark the test with `it.fails` and a comment that names the bug, so the suite stays green. Report the bug.
7. Run `npm run test:cov -- --coverage.include=<source file> <spec file>`. Add a test for each uncovered statement or branch until the file reaches 100%.
8. Run `npm run typecheck` and `npx eslint <spec file>`. Fix every error.
