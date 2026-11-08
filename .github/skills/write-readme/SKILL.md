---
name: write-readme
description: 'Write or update README.md documentation for the repository or a package. Use when asked to create, improve, or sync a README; do not use for TSDoc comments.'
---

# Write README

Write `README.md` for the project the user names. If the user names none, use the repository root `README.md`.

## Workflow

1. Read [Copilot instructions](../../copilot-instructions.md) and follow its Style rules.
2. Read the `package.json` next to the README. Take the name, description, `engines`, `bin`, `exports`, and `scripts` from it.
3. Read `src/index.ts` and follow its exports to learn the public API. For CLI commands, read the files under `src/cli/` and their argument parsers.
4. Read the existing README and keep accurate content. Never document a feature, option, or command that the code does not support.
5. Never edit the generated `## Latest version` section or `CHANGELOG.md`. Leave the release tooling to maintain them.
6. Write the sections below in order. Skip a section when it has nothing to say.
   - Title and one-sentence description.
   - Requirements: the Node version from `engines`.
   - Installation: the install command for the package name.
   - Usage: the shortest working example for each CLI command and exported function.
   - Options: a table of CLI flags or function parameters, copied from the argument parsers and types.
   - Development: the `npm run` scripts from `package.json` that contributors use.
   - License: the `license` field.
7. Keep examples copy-pasteable, and test each CLI example when it runs without side effects.
8. Link to other files with relative links.
9. Run `npx eslint README.md` only when the ESLint config covers Markdown. Otherwise reread the file for broken links and style violations.

Do not edit TSDoc comments or source files as part of this skill.
