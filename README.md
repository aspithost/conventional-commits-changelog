# @abelspithost/conventional-commits-changelog

![NPM Version](https://img.shields.io/npm/v/@abelspithost/conventional-commits-changelog)
![Build](https://img.shields.io/github/actions/workflow/status/aspithost/conventional-commits-changelog/cicd.yml)
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

The package offers two commands, `release` and `release-packages`. You can use each in two ways:

| Approach                    | Use it when                                                                    | Options                                                                  |
| --------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| [CLI](#cli)                 | You want a one-line release step in a script, a CI job, or a terminal.         | The CLI flags, marked in the option tables below.                        |
| [Programmatic](#programmatic) | You want to call the release from your own Node.js code, or you need to customize git, commit parsing, or changelog links. | Every option in the option tables below. |

The CLI exposes a subset of the options. Both approaches run the same release logic.

The two commands behave differently:

| Aspect         | `release`                                                                | `releasePackages` / `release-packages`                                                                  |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Scope          | Bumps the version and writes the changelog of one package.               | Bumps the version and writes the changelog of each package in a monorepo that has releasable commits.   |
| Git history    | Reads the history of the repository that contains the package.           | Requires a monorepo with one shared git history. Every package must live in that single repository.     |
| Commits        | Uses every commit since the latest version tag.                          | Groups the commits since the latest tag by scope. Each package receives only the commits of its scope.  |
| Release type   | Defaults to `patch`. You can force a type or a version.                  | Determines the type per package. It skips packages without a commit that warrants a release.            |
| Package lookup | Uses the `package.json` in `directoryPath`.                              | Searches `directoriesReaderOptions.directoryPath` for packages and maps their names to commit scopes.   |

### CLI

Run a command without installing the package.

```sh
npx --package @abelspithost/conventional-commits-changelog release --dry-run
npx --package @abelspithost/conventional-commits-changelog release-packages --dry-run
```

Or install the package and add the commands to your project's `package.json`:

```json
{
  "scripts": {
    "release": "release",
    "release-packages": "release-packages"
  }
}
```

Run either command through `npm run`. Pass CLI options after `--`. Use `--dry-run` to preview a release before updating files. After you install the package, `npx release` and `npx release-packages` also resolve to the local binaries.

Both commands print the error and exit with code 1 when a release fails or when you pass an unknown flag.

### Programmatic

Install the package locally, then import the functions. The option tables for each command below list every programmatic option and its CLI flag.

```ts
import { release, releasePackages } from '@abelspithost/conventional-commits-changelog';

await release({ isDryRun: true });
await releasePackages({ isDryRun: true });
```

The functions reject with the error instead of setting an exit code. Wrap the call in `try`/`catch` to handle failures. The package exports the `ReleaseOptions` and `ReleasePackagesOptions` types.

### `release`

Release a single package: `release` retrieves the commits since the latest version tag, determines the release type, bumps the version in `package.json`, and writes the changelog. Run it from the package directory:

```sh
npm run release -- --dry-run
npm run release
```

Pass `--type minor` or `--version 1.2.3` to force the release; use one, not both. The programmatic function accepts these options:

| Option                    | CLI flag                           | Description                                                                                                  |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `directoryPath`           | `--cwd <path>`                     | Directory with the `package.json` and changelog. Defaults to `process.cwd()`.                                |
| `isDryRun`                | `--dry-run`                        | Log the release type without bumping the version or writing the changelog. Defaults to `false`.              |
| `isUpdateReadme`          | `--update-readme` (default: off)   | Update the version in `README.md`. Defaults to `false`. Set it to `true` in code to enable it.               |
| `releaseType`             | `-t, --type <major\|minor\|patch>` | Force the release type.                                                                                      |
| `releaseVersion`          | `-v, --version <version>`          | Force the release version. Cannot combine with `releaseType`.                                                |
| `commits`                 | None                               | Iterable of validated commits to release. When omitted, the function retrieves the commits from git.         |
| `commitsParserOptions`    | None                               | Commit parser settings. Set `parserStreamOptions` to change how the library parses commit messages.          |
| `commitsRetrieverOptions` | None                               | Git settings for retrieving commits: `commitFormat`, `cwd`, `from`, and `to`.                                |
| `tagRetrieverOptions`     | None                               | Git settings for finding the latest tag: `cwd` and `remoteSymbolicRef`.                                      |
| `changelogWriterOptions`  | None                               | Changelog writer settings. Set `remoteRepositoryInformation` (`host`, `owner`, `repository`) to build links. |
| `onError`                 | None                               | Handler for errors that the library reports without throwing. Set it to `null` to opt out.                   |

The git options default to `process.cwd()`, not to `directoryPath`. Set `commitsRetrieverOptions.cwd` and `tagRetrieverOptions.cwd` when you release a package outside the current directory. See `ReleaseOptions` in the type declarations.

### `releasePackages`

Release every package in a monorepo that has commits with a matching scope. `releasePackages` reads one shared git history, groups the commits since the latest version tag by scope, and then bumps the version and writes the changelog of each matching package. It only works for a monorepo with a single git history. The package name without its npm scope maps to the commit scope: a commit with scope `package-a` releases `@scope/package-a`.

```text
feat(package-a): add a new option
```

```sh
npm run release-packages -- --dry-run
npm run release-packages
```

Run these commands from the monorepo root. They search the `packages` directory by default. Pass `--cwd <path>` to use another directory that contains your packages. The command accepts neither `--type` nor `--version`: it determines the release type per package and skips packages without a commit that warrants a release.

The command searches directories recursively. Use `--cwd` to narrow the search further. Every discovered `package.json` must contain a `name`. The programmatic function accepts these options:

| Option                                   | CLI flag                        | Description                                                                                                  |
| ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `directoriesReaderOptions.directoryPath` | `--cwd <path>`                  | Directory to search for packages. Defaults to `packages` in `process.cwd()`.                                  |
| `isDryRun`                               | `--dry-run`                     | Log the planned releases without bumping versions or writing changelogs. Defaults to `false`.                |
| `isUpdateReadme`                         | `--update-readme` (default: off)| Update the version in each package `README.md`. Defaults to `false`. Set it to `true` in code to enable it.  |
| `commitsParserOptions`                   | None                            | Commit parser settings. Set `parserStreamOptions` to change how the library parses commit messages.          |
| `commitsRetrieverOptions`                | None                            | Git settings for retrieving commits: `commitFormat`, `cwd`, `from`, and `to`.                                |
| `tagRetrieverOptions`                    | None                            | Git settings for finding the latest tag: `cwd` and `remoteSymbolicRef`.                                      |
| `changelogWriterOptions`                 | None                            | Changelog writer settings. Set `remoteRepositoryInformation` (`host`, `owner`, `repository`) to build links. |
| `onError`                                | None                            | Handler for errors that the library reports without throwing. Set it to `null` to opt out.                   |

The function does not accept `commits`, `directoryPath`, `releaseType`, or `releaseVersion`. The git options default to `process.cwd()`, not to `directoriesReaderOptions.directoryPath`. Run the function from the monorepo root, or set `commitsRetrieverOptions.cwd` and `tagRetrieverOptions.cwd`. See `ReleasePackagesOptions` in the type declarations.

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

## License

ISC
