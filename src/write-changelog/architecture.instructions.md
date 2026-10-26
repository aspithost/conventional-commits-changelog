---
name: 'ChangelogWriter architecture'
description: 'Use when you analyze or update logic in src/write-changelog'
applyTo: 'src/write-changelog/**'
---
# ChangelogWriter architecture

`src/write-changelog/` renders validated commits into a changelog entry and writes it into a `CHANGELOG.md` file.

```
directoryPath/filename ─► read file ─► conventional-changelog-writer (preset + context) ─► entry string
                                                                                              │
                          write file ◄─ insert above newest `## x.y.z` header ◄───────────────┘
```

`ChangelogWriter.writeChangelog` runs this flow for one directory. It reads the existing file first, so a missing changelog fails before rendering.

## Rules

### Construction

- The constructor validates its options with `changelogWriterOptions` and throws `Error('Invalid changelog writer options.', { cause })` on failure.
- The schema validates `remoteRepositoryInformation` only. `conventional-changelog-writer` defines the preset shape, so the schema skips it. The constructor stores the original values, not the parsed result.
- `ChangelogWriter.withDefaultPreset` builds the preset with `createWriterPreset`. Callers can pass their own `changelogWriterPreset` to the constructor instead.
- `createWriterPreset` wraps `conventional-changelog-conventionalcommits`. `COMMIT_TYPES` in `presets/constants/writer.ts` maps each commit type to a section heading. Its optional `config` spreads last and overrides the defaults, including the custom `formatCommitUrl`.

### Entry creation

- `date` defaults to `getFormattedDate` (`yyyy-mm-dd`). `isPatch` equals `releaseType === 'patch'`.
- The remote repository fields spread last and override any context key with the same name.
- The writer never validates commits. It accepts any `Iterable<ValidatedCommit>`.

### Insertion

- `VERSION_HEADER_PATTERN` locates the newest entry. The writer inserts the trimmed entry before it and separates the parts with one blank line.
- Without a version header, the writer treats the existing content as the header and appends the entry after a blank line. An empty file yields only the entry.
- The output always ends with a single `\n`.

### Files and errors

- The writer never creates the file. The file must exist.
- Read, entry creation, and write failures throw an `Error` with the original error as `cause`.
- The `try/catch` in `#createChangelogEntry` covers only the call that creates the generator. Failures during chunk iteration propagate unwrapped.
- The writer logs nothing and has no `onError`. Callers handle the rejected promise.
- Keep file I/O synchronous and inside `ChangelogWriter`. Keep presets and utils free of I/O.
- Never edit `CHANGELOG.md` by hand. The writer generates it.

## Consumers

`createChangelogWriter` (in `utils/`) picks the custom or default preset and builds the instance. Three callers use it:

- `releasePackages` calls `writeChangelog` once per released package.
- `release` calls `writeChangelog` for one directory.
- `generateChangelogVersioned` calls `writeChangelog` per version.

Never construct `ChangelogWriter` elsewhere.