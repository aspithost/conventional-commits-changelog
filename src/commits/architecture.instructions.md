---
name: 'Commits architecture'
description: 'Use when you change the commits pipeline in src/commits'
applyTo: 'src/commits/**'
---
# Commits folder architecture

`src/commits/` turns `git log` output into typed, validated commits.

```
git log ─► CommitsRetriever ─► CommitsParser ─► CommitsValidator* ─► ValidatedCommit<T, U>
           RawCommits          ParsedCommits    (zod schema)
```

`retrieveValidatedCommits` composes the three stages. `CommitsGrouper` groups validated commits by scope.

## Stage rules

- Each stage takes the previous stage's output type and shares no state.
- A stage keeps state in `readonly #private` fields and exposes one generator method (`*getRawCommits`, `*getParsedCommits`, `*validateCommits`).
- Generators yield one item at a time and return `Iterable<T>`. Callers that need several passes spread the result.
- `CommitsGrouper` consumes its whole input in the constructor, because grouping needs every commit.
- Git runs only when the caller iterates.
- Infer types with `z.infer`. Never duplicate them by hand.

## Stages

- **`CommitsRetriever`** runs `git log` through `_execFileSync`. The range falls back from explicit `from..to`, to the latest tag on the default remote branch, to full history. `from: null` forces full history. The constructor rejects refs that start with `-`.
- **`CommitsParser`** wraps `conventional-commits-parser`, normalizes `scope`, `subject`, and `type` to `string | null`, and attaches `hash`.
- **`CommitsValidator*`** extend `BaseCommitsValidator`, which owns the validation loop. Subclasses differ only in schema factory and result type: none, scope, type, or scope and type. Schemas live in `validate-commits/schemas/commit.ts`.

## Facade: `retrieveValidatedCommits`

- Builds the retriever and parser, then picks the validator from `allowedCommitScopes` and `allowedCommitTypes`.
- Overloads map the option shape to a precise return type. The implementation signature stays hidden and never uses `as`.
- `onError` goes to the validators. The retriever takes its own through `commitsRetrieverOptions`.

## Errors

| Situation | Behavior |
| --- | --- |
| Invalid commit | Call `onError`, skip, continue. Validation never throws. |
| No remote ref or tag | Call `onError` with a `WARN:` message, use the fallback. |
| Git failure | Throw `Error('Could not retrieve commits.', { cause })`. |
| Ref starting with `-` | Throw in the constructor. |

## Add a validation mode

1. Add a schema factory in `validate-commits/schemas/commit.ts`.
2. Add a `ValidatedCommit*` type in `validate-commits/types/commit.ts`.
3. Add a `BaseCommitsValidator` subclass with a `*validateCommits` generator.
4. Add a branch and an overload in `retrieveValidatedCommits`.
5. Add specs and export new option types from `src/index.ts`.

## Consumers

`release`, `releasePackages`, and `generateChangelogVersioned` call `retrieveValidatedCommits`. Never rebuild the retrieve, parse, and validate chain elsewhere.
