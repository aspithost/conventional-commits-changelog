# Copilot Instructions

This TypeScript library follows these rules for code, comments, and commit messages. Test files also follow `vitest.instructions.md`.

## Shared presets

Every project extends these `@abelspithost` presets. Never duplicate their settings in local config, and never suggest rules that conflict with them. A package never extends itself.

- `@abelspithost/commitlint`: commit message linting.
- `@abelspithost/conventional-commits-changelog`: Conventional commits changelog generation.
- `@abelspithost/eslint-config-ts`: ESLint rules and formatting.
- `@abelspithost/tsconfig`: TypeScript compiler options.
- `@abelspithost/tsconfig-node`: TypeScript compiler options for Node-only code and tooling.
- `@abelspithost/vitest-config`: Vitest configuration.

## TypeScript

- Never use type assertions: `as`, `<Type>value`, or `!`. Only test files may cast, under the rules in the Vitest instructions.
- Type uncertain values as `unknown`, never `any`. Narrow them with type guards, control flow, or `zod` parsing. Fix the underlying type instead of asserting around it.
- Never suggest `@ts-ignore` or `@ts-expect-error` unless the user asks.
- Use named exports only. Never use `export default`, and re-export public API through `src/index.ts`.
- Write small, focused functions. Declare explicit return types on exported functions.
- Reuse existing dependencies before adding a new library.

## Commits

- Follow Conventional Commits, as the `@abelspithost/commitlint` preset enforces.
- Write the description in imperative mood, lowercase, without a trailing period: `fix: correct null check in parser`.
- Mark breaking changes with `!` or a `BREAKING CHANGE:` footer.
- Never edit `CHANGELOG.md` by hand. The changelog preset generates it.

## Style

Apply these rules to comments, JSDoc, README content, and commit bodies.

- Write in active voice. Name the actor: "The parser rejects empty input", not "Empty input is rejected".
- Never use a form of the verb "to be": is, are, was, were, be, been, being, am.
- Keep sentences short and direct.
- Follow `@abelspithost/eslint-config-ts`. Never suggest rules that conflict with it.
