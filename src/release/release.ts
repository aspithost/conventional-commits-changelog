
import { retrieveValidatedCommits } from '../commits/retrieveValidatedCommits.js';
import type { DefaultAllowedTypes } from '../commits/types/commit.js';
import { logError } from '../utils/error/logError.js';

import type {
  ReleaseOptions,
  ReleaseOptionsWithCommits,
  ReleaseOptionsWithoutCommits,
} from './types/release.js';
import { createChangelogWriter } from './utils/createChangelogWriter.js';

import { determineReleaseType } from '@/release/utils/determineReleaseType.js';
import { bumpVersion } from '@/version/bumpVersion.js';

/**
 * Releases a single package: retrieves and validates the commits since the latest tag,
 * determines the release type, bumps the version in `package.json` (and optionally the
 * README), and writes the changelog.
 *
 * This overload retrieves commits from git. Use the overload with `commits` to supply your own.
 *
 * @typeParam T - Allowed commit scopes.
 * @typeParam U - Allowed commit types. Defaults to the conventional commit types.
 * @param options - {@link ReleaseOptionsWithoutCommits | Release options}.
 * @returns A promise that resolves when the release finishes. It also resolves
 * without changes when no release is needed.
 *
 * @remarks
 * When no commits justify a release and you do not set `releaseType`, the function
 * reports an error through `onError` and returns without changes.
 * With `isDryRun`, the function logs the release type and skips the version bump and changelog.
 *
 * Option defaults:
 * - `directoryPath`: `process.cwd()`
 * - `isDryRun`: `false`
 * - `isUpdateReadme`: `true`
 * - `onError`: `logError`, which writes to `console.error`
 *
 * @example
 * ```ts
 * await release({ isDryRun: true });
 * ```
 */
export async function release<
  T extends string,
  U extends DefaultAllowedTypes = DefaultAllowedTypes,
>(options?: ReleaseOptionsWithoutCommits<T, U>): Promise<void>;
/**
 * Releases a single package using commits that you supply instead of reading them from git.
 *
 * @typeParam T - Allowed commit scopes.
 * @typeParam U - Allowed commit types.
 * @param options - {@link ReleaseOptionsWithCommits | Release options}, including the
 * validated `commits` to release.
 * @returns A promise that resolves when the release finishes.
 *
 * @remarks
 * The release flow, dry-run behavior, and option defaults match the overload that
 * retrieves commits from git.
 *
 * @see {@link release} for the full description and option defaults.
 *
 * @example
 * ```ts
 * await release({ commits: validatedCommits });
 * ```
 */
export async function release<
  T extends string,
  U extends string,
>(options: ReleaseOptionsWithCommits<T, U>): Promise<void>;
export async function release({
  changelogWriterOptions,
  commits,
  commitsParserOptions,
  commitsRetrieverOptions,
  commitsValidatorOptions,
  directoryPath = process.cwd(),
  isDryRun = false,
  isUpdateReadme = true,
  releaseType: _releaseType,
  onError = logError,
}: ReleaseOptions<string, string> = {}): Promise<void> {
  const resolvedCommits = [
    ...(commits ?? retrieveValidatedCommits({
      commitsParserOptions,
      commitsRetrieverOptions,
      commitsValidatorOptions,
      onError,
    })),
  ];

  // Determine release type
  const releaseType = _releaseType ?? determineReleaseType(resolvedCommits);
  if (!releaseType) {
    const errorMessage = 'No release needed based on the commits since the latest tag.';
    onError(errorMessage, new Error(errorMessage));
    return;
  }
  if (isDryRun) {
    console.log(`[dry-run] Would bump with release type ${releaseType}.`);
    return;
  }

  // Bump version
  const newVersion = bumpVersion(directoryPath, releaseType, { isUpdateReadme });

  // Write changelog
  const changelogWriter = createChangelogWriter(changelogWriterOptions, onError);

  await changelogWriter.writeChangelog(
    directoryPath,
    newVersion,
    releaseType,
    resolvedCommits,
  );
}
