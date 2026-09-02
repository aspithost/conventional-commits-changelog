import type { RetrieveCommitsOptions } from '@/commits/retrieveValidatedCommits.js';
import type { DefaultAllowedTypes } from '@/commits/types/commit.js';
import type { ValidatedCommit } from '@/commits/validate-commits/types/commit.js';
import type { ErrorHandler } from '@/utils/error/logError.js';
import type { BumpVersionOptions } from '@/version/bumpVersion.js';
import type { ChangelogWriterOptions } from '@/write-changelog/ChangelogWriter.js';

export type ReleaseType = 'major' | 'minor' | 'patch';

export interface BaseReleaseOptions extends BumpVersionOptions {
  changelogWriterOptions?: Partial<ChangelogWriterOptions>;
  directoryPath?: string;
  isDryRun?: boolean;
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
