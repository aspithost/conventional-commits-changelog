import type {
  RetrieveValidatedCommitsOptions,
} from '../../../commits/utils/retrieveValidatedCommits.js';
import type { ValidatedCommit } from '../../../commits/validate-commits/CommitsValidator.js';
import type { OnError } from '../../../utils/error/types/error.js';
import type { BaseReleaseOptions } from '../schemas/releaseOptions.js';

export interface ReleaseOptions extends
  BaseReleaseOptions,
  OnError,
  RetrieveValidatedCommitsOptions
{
  /** Commits to release. When omitted, the library retrieves commits from git. */
  commits?: Iterable<ValidatedCommit>;
}
