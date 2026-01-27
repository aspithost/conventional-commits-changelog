# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TypeScript library for managing conventional changelogs in monorepos. It reads git commits, parses them according to conventional commit format, validates them using Zod schemas, groups them by scope (package), and generates changelogs per package.

## Commands

**Type-check:**
```bash
npx tsc --noEmit
```

**Lint:**
```bash
npx eslint .
```

**Run a single TypeScript file (using jiti):**
```bash
npx jiti src/test.ts
```

## Architecture

The codebase follows a pipeline pattern for processing commits:

1. **CommitsRetriever** (`src/commits/retriever/`) - Retrieves raw commits from git using `git log` between tags/refs
2. **CommitsParser** (`src/commits/parser/`) - Parses raw commit strings into structured objects using `conventional-commits-parser`
3. **CommitsValidator** (`src/commits/validator/`) - Validates parsed commits against a Zod schema with allowed scopes and types
4. **CommitsReader** (`src/commits/reader/`) - Groups validated commits by scope (package name)

Supporting components:
- **ScopesReader** (`src/scopes/reader/`) - Reads package names from `packages/` directory to determine valid scopes
- **VersionManager** (`src/version/`) - Uses `conventional-recommended-bump` to determine semver bump type and runs `npm version`
- **ChangelogWriter** (`src/writers/`) - Generates changelog entries using `conventional-changelog-writer` with Handlebars templates

### Key Design Patterns

- Classes are generic over scope (`T`) and commit type (`U`) strings for type safety
- Async generators (`AsyncGenerator`) are used throughout for streaming commit processing
- Zod schemas in `src/schemas/` validate commits and package.json files
- Presets in `src/presets/` configure parser options and writer templates

### Path Aliases

The `@/*` alias maps to `src/*` (configured in tsconfig.json).

## Code Style

- 2-space indentation
- Trailing commas on multiline structures
- Semicolons required
- No trailing whitespace
- ESM modules (`"type": "module"`)
