---
name: 'CommitsRetriever architecture'
description: 'Use when you change CommitsRetriever or its architecture'
applyTo: 'src/commits/retrieve-commits/**'
---
# CommitsRetriever architecture

`CommitsRetriever` runs `git log` and yields `{ hash, commit }` pairs. It starts the commits pipeline.

## Rules

- The ref regex in `schemas/commitsRetrieverOptions.ts` rejects values starting with `-`. This blocks Git option injection. Keep it on every ref option.
- Git runs through `execFileSyncWrapper` with an argument array. Never build a shell string.
- Git runs lazily, only when the caller iterates `getRawCommits`.
- A custom `commitFormat` must keep the `hash||message` layout and the NUL terminator, or the split breaks.

## Consumers

`retrieveValidatedCommits` builds the retriever and feeds `RawCommits` to `CommitsParser`. Never call `git log` elsewhere.