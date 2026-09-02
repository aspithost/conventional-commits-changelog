import { determineReleaseType } from '@/release/utils/determineReleaseType.js';
import { bumpVersion } from '@/version/bumpVersion.js';
import { retrieveValidatedCommits } from '../commits/retrieveValidatedCommits.js';
import type { DefaultAllowedTypes } from '../commits/types/commit.js';
import { logError } from '../utils/error/logError.js';
import type { ReleaseOptions, ReleaseOptionsWithCommits, ReleaseOptionsWithoutCommits } from './types/release.js';
import { createChangelogWriter } from './utils/createChangelogWriter.js';

export async function release<
  T extends string,
  U extends DefaultAllowedTypes = DefaultAllowedTypes
>(options?: ReleaseOptionsWithoutCommits<T, U>): Promise<void>;
export async function release<
  T extends string,
  U extends string
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
  const resolvedCommits = [...(commits ?? retrieveValidatedCommits({
    commitsParserOptions,
    commitsRetrieverOptions,
    commitsValidatorOptions,
    onError,
  }))];

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
  const changelogWriter = await createChangelogWriter(changelogWriterOptions, onError);

  await changelogWriter.writeChangelog(
    directoryPath,
    newVersion,
    releaseType,
    resolvedCommits,
  );
}
