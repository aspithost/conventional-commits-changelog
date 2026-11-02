---
name: 'CommitsGrouper architecture'
description: 'Use when you change CommitsGrouper or its architecture'
applyTo: 'src/release/release-packages/group-commits/**'
---
# CommitsGrouper architecture

`CommitsGrouper` groups validated commits by scope.

## Rules

- The constructor groups eagerly in one pass. Grouping needs every commit, so no generator.
- The grouper skips commits without a scope.
- Each group keeps input order.
- The grouper never validates, parses, or logs. It has no `onError`.

## Consumers

`releasePackages` feeds it the output of `retrieveValidatedCommits` and maps scopes to package directories through `DirectoriesReader`. Never group commits by scope elsewhere.