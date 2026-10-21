---
name: 'DirectoriesReader architecture'
description: 'Use when you analyze or update logic in src/read-directories'
applyTo: 'src/read-directories/**'
---
# DirectoriesReader architecture

`src/read-directories/` maps commit scopes to package directories. A scope equals a `package.json` `name`.

```
directoryPath ─► readdirSync (recursive) ─► package.json per directory ─► zod schema ─► Map<scope, { directoryPath }>
```

`DirectoriesReader` does all the work in its constructor. It exposes `directoryPathByScopeMap` and `scopes` (the map keys).

## Rules

- The constructor reads the filesystem synchronously and builds the map once. The instance stays immutable afterwards.
- Directories without `package.json` (`ENOENT`) get skipped silently. Any other read failure throws.
- `packageJsonSchema` in `schemas/package.ts` validates only `name`. Infer its type with `z.infer`.
- The root scope adds the repository root as an extra entry. `RootScopeOptions` makes `rootScopeName` and `rootScopeDirectoryPath` required when `addRootScope` equals `true`.
- `ScopeName<T>` (`T | (string & {})`) keeps the root scope literal visible to consumers. Keep it.

## Consumers

`releasePackages` creates the only instance. It passes `scopes` to the scope filters and `directoryPathByScopeMap` to `releaseByScope`. Never scan directories or read `package.json` elsewhere.
