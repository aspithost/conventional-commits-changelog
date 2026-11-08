---
name: write-tsdoc
description: 'Write or update TSDoc for public TypeScript function and interface signatures. Use when documenting the exported public API; do not use for README documentation.'
---

# Write TSDoc

Document only TSDoc for function and interface signatures exposed through `src/index.ts`.

## Workflow

1. Read [Copilot instructions](../../copilot-instructions.md) and inspect `eslint.config.ts` to confirm the project uses `@abelspithost/eslint-config-ts`.
2. Read `src/index.ts` and follow its exports to the declarations they expose.
3. Limit changes to TSDoc on publicly exported function declarations, interface declarations, and members that form those public interfaces. Do not document internal declarations, classes, or type aliases.
4. Read each function's implementation and relevant types before writing documentation. Describe behavior, parameters, return values, errors, and examples only when the code supports those claims.
5. Match the repository's existing TSDoc style where it agrees with the preset. Treat the TSDoc lint rules from `@abelspithost/eslint-config-ts` as authoritative; do not add or override rules or invent extra formatting requirements.
6. Run `npx eslint <changed TypeScript files>` and fix all reported TSDoc issues.

Do not edit README files or other documentation as part of this skill.