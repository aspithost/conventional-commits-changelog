---
name: write-unit-test
description: Write Vitest unit tests for a source file
---
Write Vitest unit tests for ${file}.

Follow the rules in [Vitest instructions](../../instructions/vitest.instructions.md).

- Read the source file first and cover every exported function and branch.
- Create the test file next to the source file.
- Run the new tests with `npx vitest run <test file>` and fix failures.