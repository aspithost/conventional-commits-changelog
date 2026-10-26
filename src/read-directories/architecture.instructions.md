---
name: 'DirectoriesReader architecture'
description: 'Use when you analyze or update logic in src/read-directories'
applyTo: 'src/read-directories/**'
---
# DirectoriesReader architecture

`DirectoriesReader` maps commit scopes to package directories. A scope equals a `package.json` `name` without its npm scope prefix.

## Rules

- Build the map once in the constructor. Never mutate it afterwards.
- Scan descendants only. A `package.json` in the root directory gets ignored.
- Skip directories without `package.json` silently. Throw on any other read, JSON, or schema failure, and set `cause` on wrapped errors.
- Validate only `name` in `schemas/package.ts`. Infer its type with `z.infer`.
- Strip the `@scope/` prefix from the name. When two packages share a stripped name, the later one replaces the earlier one.
- Never log and never take `onError`. Errors propagate.

## Consumers

`releasePackages` creates the only instance. It throws on an empty map and looks up each commit scope to find the package directory. Scan directories and read `package.json` only here.