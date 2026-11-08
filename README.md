# @abelspithost/conventional-commits-changelog

![NPM Version](https://img.shields.io/npm/v/@abelspithost/conventional-commits-changelog)
![Build](https://img.shields.io/github/actions/workflow/status/aspithost/conventional-commits-changelog/ci.yml)
[![Quality gate status](https://sonarcloud.io/api/project_badges/measure?project=aspithost_conventional-commits-changelog&metric=alert_status&token=34d4ebaf9ae28eb47b597e65f2fec6d87871513f)](https://sonarcloud.io/summary/new_code?id=aspithost_conventional-commits-changelog)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=aspithost_conventional-commits-changelog&metric=security_rating&token=34d4ebaf9ae28eb47b597e65f2fec6d87871513f)](https://sonarcloud.io/summary/new_code?id=aspithost_conventional-commits-changelog)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=aspithost_conventional-commits-changelog&metric=coverage&token=34d4ebaf9ae28eb47b597e65f2fec6d87871513f)](https://sonarcloud.io/summary/new_code?id=aspithost_conventional-commits-changelog)

Generate changelog entries and bump npm package versions from your Conventional Commits history.

## Requirements

- Node.js `>=26`.
- A git repository that follows the [Conventional Commits](https://www.conventionalcommits.org) convention. The commit retrievers and validators parse every commit as a conventional commit, so non-conforming commits break the release.

## Installation

```sh
npm install --save-dev @abelspithost/conventional-commits-changelog
```

## How it works

1. The library retrieves the commits since the latest version tag.
2. It validates each commit against the Conventional Commits structure.
3. It determines the release type from the commits:
   - A `BREAKING CHANGE` note triggers a `major` release.
   - A `feat` commit triggers a `minor` release.
   - A `fix` commit triggers a `patch` release.
4. It bumps the version in `package.json`, updates the README, and writes the changelog.

The library does not commit, tag, or publish. Run those steps yourself after the release.

When `release` finds no commit that warrants a release, it defaults to a `patch` release. `releasePackages` skips packages without such commits.

## Usage

### `release`

Release a single package. The command acts on the current working directory.

```sh
npx release
```

```ts
import { release } from '@abelspithost/conventional-commits-changelog';

await release({ isDryRun: true });
```

| CLI flag                         | Option            | Description                                                                  |
| -------------------------------- | ----------------- | ---------------------------------------------------------------------------- |
| `--cwd <path>`                   | `directoryPath`   | Directory with the `package.json` and changelog. Defaults to the current directory. |
| `--dry-run`                      | `isDryRun`        | Log the release type without bumping the version or writing the changelog.   |
| `--update-readme` (default: on)  | `isUpdateReadme`  | Update the version in `README.md`. Set the option to `false` in code to skip it. |
| `-t, --type <major\|minor\|patch>` | `releaseType`     | Force the release type.                                                      |
| `-v, --version <version>`        | `releaseVersion`  | Force the release version. Cannot combine with `--type`.                     |

The function also accepts `changelogWriterOptions`, `commits`, `commitsParserOptions`, `commitsRetrieverOptions`, `tagRetrieverOptions`, and `onError`. See `ReleaseOptions` in the type declarations.

### `releasePackages`

Release every package in a monorepo whose name matches a commit scope. The package name without its npm scope maps to the commit scope: a commit with scope `package-a` releases `@scope/package-a`.

```sh
npx release-packages
```

```ts
import { releasePackages } from '@abelspithost/conventional-commits-changelog';

await releasePackages({ isDryRun: true });
```

```text
feat(package-a): add a new option
```

| CLI flag                        | Option                                 | Description                                                                |
| ------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| `--cwd <path>`                  | `directoriesReaderOptions.directoryPath` | Directory to search for packages. Defaults to the current directory.       |
| `--dry-run`                     | `isDryRun`                             | Log the planned releases without bumping versions or writing changelogs.   |
| `--update-readme` (default: on) | `isUpdateReadme`                       | Update the version in each package `README.md`. Set the option to `false` in code to skip it. |

The function also accepts `changelogWriterOptions`, `commitsParserOptions`, `commitsRetrieverOptions`, `tagRetrieverOptions`, and `onError`. See `ReleasePackagesOptions` in the type declarations.

### Version in the README

When `isUpdateReadme` applies, the library replaces the first `major.minor.patch` version it finds in `README.md`. Keep a version section, such as `## Latest version`, above any other version-like text.

## Experimental: `generateChangelog`

> [!WARNING]
> `generateChangelog` has experimental status. The maintainer does not support it and does not version it according to semver, so it can change or disappear in any release.

`generateChangelog` writes changelog entries for the version tags already in your history. Use it to backfill existing releases, and use `release` afterwards.

```ts
import { generateChangelog } from '@abelspithost/conventional-commits-changelog';

await generateChangelog({ isDryRun: true });
```

## Development

| Script               | Description                          |
| -------------------- | ------------------------------------ |
| `npm run build`      | Compile the library.                 |
| `npm run lint`       | Run ESLint and publint.              |
| `npm run typecheck`  | Type-check the source and tests.     |
| `npm run test:unit`  | Run the unit tests in watch mode.    |
| `npm run test:cov`   | Run the unit tests with coverage.    |

## License

ISC
