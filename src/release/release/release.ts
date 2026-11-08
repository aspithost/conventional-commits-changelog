import { retrieveValidatedCommits } from '../../commits/utils/retrieveValidatedCommits.js';
import { logError } from '../../utils/error/logError.js';
import { bumpVersion } from '../../version/bumpVersion.js';
import { createChangelogWriter } from '../../write-changelog/utils/createChangelogWriter.js';
import { determineReleaseType } from '../utils/determineReleaseType.js';

import type { ReleaseOptions } from './types/release.js';
import { validateReleaseInput } from './utils/validateReleaseInput.js';

/**
 * Releases a single package: retrieves and validates the commits since the latest tag,
 * determines the release type, bumps the version in `package.json` (and optionally the
 * README), and writes the changelog. The function defaults to a patch release when no
 * commit indicates a release.
 *
 * @param options - {@link ReleaseOptions | Release options}.
 * @returns A promise that resolves when the release finishes.
 *
 * @remarks
 * When you provide an iterable of `commits`, the release function will not retrieve commits from
 * git and will use the supplied commits instead.
 *
 * @remarks
 * With `isDryRun`, the function logs the release type and skips the version bump and changelog.
 *
 * @example
 * ```ts
 * await release({ isDryRun: true });
 * ```
 */
export async function release({
  changelogWriterOptions,
  commits,
  commitsParserOptions,
  commitsRetrieverOptions,
  directoryPath = process.cwd(),
  isDryRun = false,
  isUpdateReadme = false,
  releaseType: _releaseType,
  releaseVersion,
  tagRetrieverOptions,
  onError = logError,
}: ReleaseOptions = {}): Promise<void> {
  validateReleaseInput({
    changelogWriterOptions,
    directoryPath,
    isDryRun,
    isUpdateReadme,
    releaseType: _releaseType,
    releaseVersion,
  });

  const releaseType = _releaseType ?? determineReleaseType(commits ?? retrieveValidatedCommits({
    commitsParserOptions,
    commitsRetrieverOptions,
    tagRetrieverOptions,
    onError,
  })) ?? 'patch';
  if (isDryRun) {
    console.log(`[dry-run] Will bump version with type ${releaseType}.`);
    return;
  }

  const newVersion = bumpVersion(directoryPath, releaseVersion ?? releaseType, {
    isUpdateReadme,
    onError,
  });

  await createChangelogWriter(changelogWriterOptions).writeChangelog(
    directoryPath,
    newVersion,
    releaseType,
    commits ?? retrieveValidatedCommits({
      commitsParserOptions,
      commitsRetrieverOptions,
      tagRetrieverOptions,
      onError,
    }),
  );
}
