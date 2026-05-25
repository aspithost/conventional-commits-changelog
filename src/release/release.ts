import { bumpVersion, type BumpVersionOptions } from '@/version/bump-version/bumpVersion.js';
import { determineReleaseType } from '@/version/determine-release-type/determineReleaseType.js';
import type { DefaultAllowedTypes } from '@/write-changelog/presets/types/writer.js';

import { retrieveValidatedCommits, type RetrieveCommitsOptions } from '../shared/commits/retrieveValidatedCommits.js';
import { ChangelogWriter, type ChangelogWriterOptions } from '../write-changelog/ChangelogWriter.js';
import type { ReleaseType } from '../types/index.js';
import type { ValidatedCommits } from '../shared/commits/validate-commits/types/commits.js';

interface BaseReleaseOptions {
  releaseType?: ReleaseType;
  bumpVersionOptions?: BumpVersionOptions & { directoryPath?: string };
  changelogWriterOptions?: Partial<ChangelogWriterOptions>;
}

interface ReleaseOptionsWithoutCommits<T extends string, U extends DefaultAllowedTypes = DefaultAllowedTypes> extends BaseReleaseOptions {
  retrieveCommitsOptions?: Partial<RetrieveCommitsOptions<T, U>>;
}
interface ReleaseOptionsWithCommits<T extends string, U extends string> extends BaseReleaseOptions {
  commits: ValidatedCommits<T, U>;
}

interface ReleaseOptions<T extends string, U extends string> extends BaseReleaseOptions {
  retrieveCommitsOptions?: Partial<RetrieveCommitsOptions<T, U>>;
  commits?: ValidatedCommits<T, U>;
}

export async function release(): Promise<void>;
export async function release<T extends string, U extends DefaultAllowedTypes = DefaultAllowedTypes>({
  releaseType,
  bumpVersionOptions,
  changelogWriterOptions,
  retrieveCommitsOptions,
}: ReleaseOptionsWithoutCommits<T, U>): Promise<void>;
export async function release<T extends string, U extends string>({
  releaseType,
  bumpVersionOptions,
  changelogWriterOptions,
  commits,
}: ReleaseOptionsWithCommits<T, U>): Promise<void>;
export async function release({
  releaseType: _releaseType,
  bumpVersionOptions: {
    isDryRun = false,
    isUpdateReadme = true,
    directoryPath = process.cwd(),
  } = {},
  changelogWriterOptions,
  retrieveCommitsOptions,
  commits,
}: ReleaseOptions<string, string> = {}): Promise<void> {
  // Determine release type
  const releaseType = _releaseType ?? determineReleaseType(commits ?? retrieveValidatedCommits({
    allowedScopes: retrieveCommitsOptions?.allowedScopes,
    allowedTypes: retrieveCommitsOptions?.allowedTypes,
    commitsParserOptions: retrieveCommitsOptions?.commitsParserOptions,
    commitsRetrieverOptions: retrieveCommitsOptions?.commitsRetrieverOptions,
  }));
  if (!releaseType) {
    console.log('No release needed based on the commits since the latest tag.');
    return;
  }
  if (isDryRun) {
    console.log(`[dry-run] Would bump with release type ${releaseType}.`);
    return;
  }

  // Bump version
  const newVersion = bumpVersion(directoryPath, releaseType, { isUpdateReadme });

  // Write changelog
  const changelogWriter = changelogWriterOptions?.changelogWriterPreset
    ? new ChangelogWriter(
      changelogWriterOptions.changelogWriterPreset,
      changelogWriterOptions.remoteRepositoryInformation,
    ) : await ChangelogWriter.withDefaultPreset(changelogWriterOptions?.remoteRepositoryInformation);

  await changelogWriter.writeChangelog(
    directoryPath,
    newVersion,
    releaseType,
    commits ?? retrieveValidatedCommits({
      allowedScopes: retrieveCommitsOptions?.allowedScopes,
      allowedTypes: retrieveCommitsOptions?.allowedTypes,
      commitsParserOptions: retrieveCommitsOptions?.commitsParserOptions,
      commitsRetrieverOptions: retrieveCommitsOptions?.commitsRetrieverOptions,
    }),
  );
}
