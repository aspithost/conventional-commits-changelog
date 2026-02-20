# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TypeScript library for monorepo package management that automatically updates package versions according to the conventional commits standard and generates changelogs. It reads git commits, parses them according to conventional commit format, validates them using Zod schemas, determines version bumps per package scope, and generates changelogs for each package.

## Project Structure

```
src/
├── bumper/              # VersionBumper - determines and applies version bumps
├── commits/
│   ├── parser/          # CommitsParser - parses raw commits to structured format
│   ├── retriever/       # CommitsRetriever - fetches commits from git
│   └── validator/       # CommitsValidator - validates against Zod schemas. Scopes can be defined either at build-time or run-time
├── presets/
│   ├── constants/       # Parser config, commit types, emoji mappings
│   └── templates/       # Handlebars templates for changelog formatting
├── scopes/reader/       # ScopesReader - discovers packages from a specified directory name. Defaults to packages/
├── schemas/             # Zod validation schemas (commit, package)
├── types/               # Shared type definitions (ReleaseType, etc.)
├── utils/               # Shell execution utilities
├── version/             # VersionUpdater - main orchestrator
└── writer/              # ChangelogWriter - generates CHANGELOG.md files
```

## Data Flow

```
git log → CommitsRetriever → RawCommits (Generator)
        → CommitsParser → ParsedCommits (Generator)
        → CommitsValidator → ValidatedCommits (Generator)
        → Filter by scope
        → VersionBumper → { newVersion, releaseType }
        → ChangelogWriter → Updated CHANGELOG.md
```

## Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| CommitsRetriever | `src/commits/retriever/` | Executes `git log`, yields raw commits as Generator |
| CommitsParser | `src/commits/parser/` | Extracts type, scope, subject, body, breaking changes |
| CommitsValidator | `src/commits/validator/` | Validates commits with Zod, filters by allowed scopes/types |
| ScopesReader | `src/scopes/reader/` | Reads package.json files from `packages/` directory |
| VersionBumper | `src/bumper/` | , runs `npm version` |
| ChangelogWriter | `src/writer/` | Generates changelog entries with Handlebars templates |
| VersionUpdater | `src/version/` | Main orchestrator (in development) |

## Commands

```bash
npm run build      # Clean, typecheck, compile to dist/
npm run typecheck  # Type checking without emit
npm run test       # Run vitest
npm run test:cov   # Run tests with coverage
npm run clean      # Remove dist/ directory
```

## Code Style

- NEVER use type assertion or type casting.
- 2-space indentation
- Trailing commas on multiline structures
- Semicolons required
- No trailing whitespace
- ESM modules (`"type": "module"`)
- Use `@/*` path alias for imports from `src/`

## Architecture Patterns

- **Generator-based streams**: All commit processing uses Generators for memory efficiency
- **Zod validation**: Runtime type validation with dynamic schema creation
- **Factory methods**: Classes provide static factory methods (e.g., `withDefaultScopes()`)
- **Monorepo support**: Scope-based filtering ties commits to packages

## Key Configuration

### Commit Types (`src/presets/constants/writer.ts`)

| Type | Section | Visible |
|------|---------|---------|
| feat | Features | Yes |
| fix | Bug Fixes | Yes |
| perf | Performance Improvements | Yes |
| refactor | Code Refactoring | Yes |
| revert | Reverts | Yes |
| test | Tests | Yes |
| build | Build System | Yes |
| ci | Continuous Integration | Yes |
| docs | Documentation | Yes |
| chore | - | Hidden |
| style | - | Hidden |

### Parser Settings (`src/presets/constants/parser.ts`)

- Header pattern: `type(scope)!: subject`
- Breaking change keywords: `BREAKING CHANGE`, `BREAKING-CHANGE`
- Issue prefixes: `#`, `gh-`, `GH-`

## Testing

- Framework: Vitest with globals enabled
- Test files: `src/**/*.spec.ts`
- Coverage excludes: `src/schemas/**`
- Pattern: Mock external dependencies (git commands, file I/O)
- Write tests from the perspective of an end-user.

## Key Dependencies

- `zod` - Schema validation
- `conventional-commits-parser` - Commit message parsing
- `conventional-changelog-writer` - Changelog generation
- `conventional-recommended-bump` - Version bump determination
- `handlebars` - Template rendering for changelogs

## Development Notes

- CommitsValidator has factory methods: `withDefaultScopes()`, `withDefaultTypes()`, `withDefaultScopesAndTypes()`
- VersionBumper supports `dryRun` mode for testing
- ChangelogWriter inserts new entries at top of existing CHANGELOG.md
- The "root" scope is used for commits without a scope
