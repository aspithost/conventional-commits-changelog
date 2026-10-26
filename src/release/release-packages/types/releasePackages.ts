import type {
  RetrieveValidatedCommitsOptions,
} from '../../../commits/utils/retrieveValidatedCommits.js';
import type {
  DirectoriesReaderOptions,
} from '../../../read-directories/types/directoriesReader.js';
import type { OnError } from '../../../utils/error/types/error.js';
import type { BaseReleaseOptions } from '../../release/schemas/releaseOptions.js';

interface BaseReleasePackageOptions extends Omit<
  BaseReleaseOptions,
'directoryPath' | 'releaseType' | 'releaseVersion'
> {
  /**
   * Options for finding packages and mapping them to commit scopes.
   *
   * @see {@link DirectoriesReaderOptions}
   */
  directoriesReaderOptions?: DirectoriesReaderOptions;
}

/**
 * Options for `releasePackages`. Combines {@link BaseReleaseOptions} (without
 * `directoryPath` and `releaseType`) and {@link RetrieveValidatedCommitsOptions}.
 */
export type ReleasePackagesOptions = BaseReleasePackageOptions
  & RetrieveValidatedCommitsOptions
  & OnError;
