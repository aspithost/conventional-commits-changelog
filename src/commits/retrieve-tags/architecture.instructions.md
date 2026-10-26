---
name: 'TagRetriever architecture'
description: 'Use when you change TagRetriever or its architecture'
applyTo: 'src/commits/retrieve-tags/**'
---
# TagRetriever architecture

`TagRetriever` finds the latest tag on the default remote branch. It resolves the branch with `git symbolic-ref`, then runs `git describe`.

## Rules

- Validate options with `tagRetrieverOptions` in `schemas/`. Its `remoteSymbolicRef` regex rejects a leading `-` and blocks Git option injection. Apply the same regex to every ref option.
- Pass Git arguments as an array. Never build a shell string.
- Run Git only inside `getLatestTag`. Never run it in the constructor.
- Never throw on a Git failure. Report through `onError` and use the fallback.

## Consumers

`retrieveValidatedCommits` passes `getLatestTag()` as `from` when the caller omits `from`. A `null` result means full history. The facade does not forward its `onError`, so tag warnings never reach the caller. Run tag lookups only through `TagRetriever`.