---
name: 'ChangelogWriter architecture'
description: 'Use when you analyze or update logic in src/write-changelog'
applyTo: 'src/write-changelog/**'
---
# ChangelogWriter architecture

`src/write-changelog/` renders validated commits into a changelog entry and writes it into a `CHANGELOG.md` file.

```
commits ─► conventional-changelog-writer (preset) ─► entry string ─► insert above newest version ─► write file
```

`ChangelogWriter.writeChangelog` runs this flow for one directory. It reads the existing file first, so a missing changelog fails early.

## Rules

- `ChangelogWriter` holds a preset and optional `remoteRepositoryInformation` (`host`, `owner`, `repository`). The writer uses them for commit and compare links.
- `createWriterPreset` wraps `conventional-changelog-conventionalcommits`. `COMMIT_TYPES` in `presets/constants/writer.ts` maps each commit type to a section heading. A custom `formatCommitUrl` builds commit links.
- `ChangelogWriter.withDefaultPreset` uses `createWriterPreset`. Callers can pass their own `changelogWriterPreset` instead.
- The writer collects the async chunks of the entry into one string. `isPatch` comes from `releaseType`. `date` defaults to `getFormattedDate` (`yyyy-mm-dd`).
- `VERSION_HEADER_PATTERN` (`## x.y.z`) locates the newest entry. The writer inserts the new entry before it and keeps the file header intact. Without a version header, the writer appends the entry after the header.
- Read, entry creation, and write failures throw an `Error` with the original error as `cause`.
- `filename` defaults to `CHANGELOG.md`. The writer never creates the file.
- Keep file I/O synchronous and inside `ChangelogWriter`. Keep presets and utils free of I/O.

## Consumers

`createChangelogWriter` (in `utils/`) picks the custom or default preset. `release` and `generateChangelogVersioned` call it. Never construct `ChangelogWriter` elsewhere.