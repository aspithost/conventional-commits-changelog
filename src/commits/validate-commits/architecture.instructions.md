---
name: 'CommitsValidator architecture'
description: 'Use when you change CommitsValidator or its architecture'
applyTo: 'src/commits/validate-commits/**'
---
# CommitsValidator architecture

`CommitsValidator` filters parsed commits through `commitSchema`. It yields valid commits and skips invalid ones.

## Rules

- Define the commit shape only in `schemas/commit.ts`. Derive `ValidatedCommit` with `z.infer`. Never declare it by hand.
- Report invalid commits through `onError`. Never throw.
- Yield `result.data`, never the input object.
- A valid commit can hold `null` for `scope`, `subject`, or `type`. Later stages handle those commits.
- Never run Git or parse messages here.

## Change the schema

1. Update `commitSchema`.
2. Confirm `CommitsParser` supplies each new required field.
3. Update the specs for valid and invalid commits.

## Consumers

`retrieveValidatedCommits` builds the validator and passes its `onError`. `ChangelogWriter` and `determineReleaseType` consume `ValidatedCommit`. Validate commits only here.