import type { RetrieveCommitsOptions } from '@/commits/retrieveValidatedCommits.js';
import type { ScopesReaderOptions } from '@/read-directories/DirectoriesReader.js';
import type { BaseReleaseOptions } from '@/release/types/release.js';

interface BaseReleasePackageOptions<
  T extends string,
> extends Omit<BaseReleaseOptions, 'releaseType'> {
  rootScopeOptions?: ScopesReaderOptions<T>['rootScopeOptions'];
}

export type ReleasePackagesOptions<
  T extends string,
> = BaseReleasePackageOptions<T> & RetrieveCommitsOptions<T, string>;
