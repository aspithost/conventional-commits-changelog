import type { RetrieveCommitsOptions } from '../../../commits/retrieveValidatedCommits.js';
import type { DefaultAllowedTypes } from '../../../commits/types/commit.js';
import type { ValidatedCommit } from '../../../commits/validate-commits/types/commit.js';
import type { OnError } from '../../../utils/error/types/error.js';
import type { BaseReleaseOptions } from '../schemas/releaseOptions.js';

type ReleaseOptionsWithOnError = BaseReleaseOptions & OnError;

export type ReleaseOptionsWithoutCommits<
  T extends string,
  U extends DefaultAllowedTypes = DefaultAllowedTypes,
> = ReleaseOptionsWithOnError & RetrieveCommitsOptions<T, U>;

export interface ReleaseOptionsWithCommits<
  T extends string,
  U extends string,
> extends ReleaseOptionsWithOnError {
  /** Validated commits to release, instead of commits retrieved from git. */
  commits: Iterable<ValidatedCommit<T, U>>;
}

export interface ReleaseOptions<
  T extends string,
  U extends string,
> extends ReleaseOptionsWithOnError, Partial<RetrieveCommitsOptions<T, U>> {
  /** Validated commits to release. When omitted, the library retrieves commits from git. */
  commits?: Iterable<ValidatedCommit<T, U>>;
}
