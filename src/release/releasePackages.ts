import { CommitsGrouper } from '../commits/group-commits/CommitsGrouper.js';
import { retrieveValidatedCommits } from '../commits/retrieveValidatedCommits.js';
import { DirectoriesReader } from '../read-directories/DirectoriesReader.js';
import { logError } from '../utils/error/logError.js';

import type { ReleasePackagesOptions } from './release-packages/types/releasePackages.js';
import { getAllowedCommitsScopes } from './release-packages/utils/getAllowedCommitsScopes.js';
import { getFilteredCommitsScopes } from './release-packages/utils/getFilteredCommitsScopes.js';
import { logRejectedPromises } from './release-packages/utils/logRejectedPromises.js';
import { releaseByScope } from './release-packages/utils/releaseByScope.js';

/**
 * Releases packages whose commit scopes map to package directories and whose commits
 * warrant a release. The function reads package directories, maps commit scopes to
 * packages, and releases each eligible package with its own commits.
 *
 * @typeParam T - Allowed commit scopes.
 * @param options - {@link ReleasePackagesOptions | ReleasePackages options}.
 * @returns A promise that resolves when all packages finish releasing.
 * @throws Error when the specified directory contains no scopes.
 *
 * @remarks
 * The function reports changelog-writing failures through
 * {@link ReleasePackagesOptions.onError | onError} after all attempted changelog writes settle.
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
    logRejectedPromises(releasePackagesResults, onError, 'A package release failed.');
  }
}
