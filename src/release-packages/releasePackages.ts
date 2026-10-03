import type { ReleasePackagesOptions } from './types/releasePackages.js';
import { getAllowedCommitScopes } from './utils/getAllowedCommitScopes.js';
import { handleReleasePackagesErrors } from './utils/handleReleaseErrors.js';
import { releaseByScope } from './utils/releaseByScope.js';

import { CommitsGrouper } from '@/commits/group-commits/CommitsGrouper.js';
import { retrieveValidatedCommits } from '@/commits/retrieveValidatedCommits.js';
import { DirectoriesReader } from '@/read-directories/DirectoriesReader.js';
import { logError } from '@/utils/error/logError.js';

// to-do: add option to filter out scope in package name
export async function releasePackages<T extends string>({
  changelogWriterOptions,
  commitsParserOptions,
  commitsRetrieverOptions,
  commitsValidatorOptions,
  directoriesReaderOptions = {
    directoryPath: process.cwd(),
  },
  isDryRun = false,
  isUpdateReadme = true,
  onError = logError,
}: ReleasePackagesOptions<T> = {}): Promise<void> {
  const { directoryPath, rootScopeOptions } = directoriesReaderOptions;
  const directoriesReader = new DirectoriesReader({
    directoryPath,
    rootScopeOptions,
    onError,
  });
  const { directoryPathByScopeMap } = directoriesReader;
  if (!directoryPathByScopeMap.size) throw new Error('No scopes found in the specified directory');

  const allowedCommitScopes = getAllowedCommitScopes(
    directoriesReader.scopes,
    commitsValidatorOptions?.allowedCommitScopes,
  );

  const resolvedCommits = [...retrieveValidatedCommits({
    commitsParserOptions,
    commitsRetrieverOptions,
    commitsValidatorOptions: {
      ...commitsValidatorOptions,
      allowedCommitScopes,
    },
    onError,
  })];

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

  handleReleasePackagesErrors(releasePackagesResults, onError);
}
