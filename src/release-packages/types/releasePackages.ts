import type { RetrieveCommitsOptions } from '@/commits/retrieveValidatedCommits.js';
import type { DirectoriesReaderOptions } from '@/read-directories/DirectoriesReader.js';
import type { BaseReleaseOptions } from '@/release/types/release.js';

/**
 * Extends {@link DirectoriesReaderOptions} with scope filtering.
 *
 * @typeParam T - Name of the optional root scope.
 */
interface DirectoriesReaderOptionsExtended<T extends string> extends DirectoriesReaderOptions<T> {
  /**
   * Strips the npm scope prefix from package names, so `@org/pkg` becomes the
   * commit scope `pkg`.
   */
  isFilterScope?: boolean;
}

interface BaseReleasePackageOptions<
  T extends string,
> extends Omit<BaseReleaseOptions, 'directoryPath' | 'releaseType'> {
  /** Options for finding packages and mapping them to commit scopes. */
  directoriesReaderOptions?: DirectoriesReaderOptionsExtended<T>;
}

/**
 * Options for `releasePackages`. Combines {@link BaseReleaseOptions} (without
 * `directoryPath` and `releaseType`) and {@link RetrieveCommitsOptions}.
 *
 * @typeParam T - Allowed commit scopes.
 */
export type ReleasePackagesOptions<
  T extends string,
> = BaseReleasePackageOptions<T> & RetrieveCommitsOptions<T, string>;
