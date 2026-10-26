---
name: 'CommitsParser architecture'
description: 'Use when you change CommitsParser or its architecture'
applyTo: 'src/commits/parse-commits/**'
---
# CommitsParser architecture

`src/commits/parse-commits/` turns `RawCommits` (from `CommitsRetriever`) into `ParsedCommits` via `conventional-commits-parser`.

## Rules

- `parserStreamOptions` defaults to `PARSER_STREAM_OPTIONS` (`constants/parser.ts`). Callers override it as a whole, never in part.
- `PARSER_STREAM_OPTIONS` uses `satisfies ParserStreamOptions` to keep literal types narrow. Keep it.
- Yield lazily, one `ParsedCommit` per raw commit.
- Never skip, filter, or reject commits. Non-matching messages yield `null` fields. The validator handles them.
- No logging, no `onError`, no Git, no shared state between calls.

## Consumers

`retrieveValidatedCommits` is the only place that parses commit messages.