import { determineReleaseType } from '@/release/utils/determineReleaseType.js';
import { bumpVersion, type BumpVersionOptions } from '@/version/bumpVersion.js';
import type { RetrieveCommitsOptions } from '../commits/retrieveValidatedCommits.js';
import { retrieveValidatedCommits } from '../commits/retrieveValidatedCommits.js';
import type { DefaultAllowedTypes } from '../commits/types/commit.js';
import type { ValidatedCommit } from '../commits/validate-commits/types/commit.js';
import { logError, type ErrorHandler } from '../utils/error/logError.js';
import { ChangelogWriter, type ChangelogWriterOptions } from '../write-changelog/ChangelogWriter.js';
import type { ReleaseType } from './types/release.js';

export interface BaseReleaseOptions extends BumpVersionOptions {
  changelogWriterOptions?: Partial<ChangelogWriterOptions>;
  directoryPath?: string;
  isDryRun?: boolean;
  isUpdateReadme?: boolean;
  releaseType?: ReleaseType;
  onError?: ErrorHandler;
}

export type ReleaseOptionsWithoutCommits<
  T extends string,
  U extends DefaultAllowedTypes = DefaultAllowedTypes
> = BaseReleaseOptions & RetrieveCommitsOptions<T, U>;

export interface ReleaseOptionsWithCommits<
  T extends string,
  U extends string
> extends BaseReleaseOptions {
  commits: Iterable<ValidatedCommit<T, U>>;
}

export interface ReleaseOptions<
  T extends string,
  U extends string
> extends BaseReleaseOptions, Partial<RetrieveCommitsOptions<T, U>> {
  commits?: Iterable<ValidatedCommit<T, U>>;
}

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
  const resolvedCommits = commits ?? retrieveValidatedCommits({
    commitsParserOptions,
    commitsRetrieverOptions,
    commitsValidatorOptions,
    onError,
  });

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
  const { remoteRepositoryInformation } = changelogWriterOptions?.options ?? {};
  const changelogWriter = changelogWriterOptions?.changelogWriterPreset
    ? new ChangelogWriter(
      changelogWriterOptions.changelogWriterPreset,
      {
        remoteRepositoryInformation,
      },
    ) : await ChangelogWriter.withDefaultPreset(
      remoteRepositoryInformation,
      onError,
    );

  await changelogWriter.writeChangelog(
    directoryPath,
    newVersion,
    releaseType,
    resolvedCommits,
  );
}
