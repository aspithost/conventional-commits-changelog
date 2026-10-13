import { CommitsGrouper } from '../commits/group-commits/CommitsGrouper.js';
import { retrieveValidatedCommits } from '../commits/retrieveValidatedCommits.js';
import { DirectoriesReader } from '../read-directories/DirectoriesReader.js';
import { logError } from '../utils/error/logError.js';

import type { ReleasePackagesOptions } from './types/releasePackages.js';
import { getAllowedCommitsScopes } from './utils/getAllowedCommitsScopes.js';
import { getFilteredCommitsScopes } from './utils/getFilteredCommitsScopes.js';
import { handleReleasePackagesErrors } from './utils/handleReleaseErrors.js';
import { releaseByScope } from './utils/releaseByScope.js';

/**
 * Releases every package in a monorepo. The function reads the package directories,
 * maps each commit scope to its package, and releases each package with its own
 * commits: version bump plus changelog.
 *
 * @typeParam T - Allowed commit scopes.
 * @param options - {@link ReleasePackagesOptions | Release options}.
 * @returns A promise that resolves when all packages finish releasing.
 * @throws Error when the specified directory contains no scopes.
 *
 * @remarks
 * The function reports per-package failures through
 * {@link ReleasePackagesOptions.onError | onError} once all packages finish.
 * With {@link ReleasePackagesOptions.isDryRun | isDryRun}, the function skips version bumps
 * and changelog writes.
 *
 * @example
 * ```ts
 * await releasePackages({ isDryRun: true });
 * ```
 */
export async function releasePackages<T extends string>({
  changelogWriterOptions,
  commitsParserOptions,
  commitsRetrieverOptions,
  commitsValidatorOptions,
  directoriesReaderOptions = {
    directoryPath: process.cwd(),
    isFilterScope: false,
  },
  isDryRun = false,
  isUpdateReadme = true,
  onError = logError,
}: ReleasePackagesOptions<T> = {}): Promise<void> {
  const { directoryPath, rootScopeOptions } = directoriesReaderOptions;
  const directoriesReader = new DirectoriesReader({
    directoryPath,
    rootScopeOptions,
  });
  const { directoryPathByScopeMap } = directoriesReader;
  if (!directoryPathByScopeMap.size) throw new Error('No scopes found in the specified directory');

  const filteredScopes = getFilteredCommitsScopes(
    directoriesReader.scopes,
    directoriesReaderOptions.isFilterScope,
  );

  const allowedCommitScopes = getAllowedCommitsScopes(
    filteredScopes,
    commitsValidatorOptions?.allowedCommitScopes,
  );

  const resolvedCommits = [
    ...retrieveValidatedCommits({
      commitsParserOptions,
      commitsRetrieverOptions,
      commitsValidatorOptions: {
        ...commitsValidatorOptions,
        allowedCommitScopes,
      },
      onError,
    }),
  ];

  const commitsGrouper = new CommitsGrouper(resolvedCommits, allowedCommitScopes);
  const { commitsByScopeMap } = commitsGrouper;

  const releasePackagesResults = await releaseByScope(
    directoryPathByScopeMap,
    commitsByScopeMap,
    {
      changelogWriterOptions,
      isDryRun,
      isUpdateReadme,
      onError,
    },
  );

  if (onError) {
    handleReleasePackagesErrors(releasePackagesResults, onError);
  }
}
