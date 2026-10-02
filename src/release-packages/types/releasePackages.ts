import type { RetrieveCommitsOptions } from '@/commits/retrieveValidatedCommits.js';
import type { DirectoriesReaderOptions } from '@/read-directories/DirectoriesReader.js';
import type { BaseReleaseOptions } from '@/release/types/release.js';

interface BaseReleasePackageOptions<
  T extends string,
> extends Omit<BaseReleaseOptions, 'directoryPath' | 'releaseType'> {
  directoriesReaderOptions?: DirectoriesReaderOptions<T>;
}

export type ReleasePackagesOptions<
  T extends string,
> = BaseReleasePackageOptions<T> & RetrieveCommitsOptions<T, string>;
