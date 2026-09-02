import { CommitsGrouper } from '@/commits/group-commits/CommitsGrouper.js';
import { retrieveValidatedCommits } from '@/commits/retrieveValidatedCommits.js';
import { DirectoriesReader } from '@/read-directories/DirectoriesReader.js';
import { logError } from '@/utils/error/logError.js';

import type { ReleasePackagesOptions } from './types/releasePackages.js';
import { getAllowedCommitScopes } from './utils/getAllowedCommitScopes.js';
import { handleReleasePackagesErrors } from './utils/handleReleaseErrors.js';
import { releaseByScope } from './utils/releaseByScope.js';

export async function releasePackages<T extends string>({
  changelogWriterOptions,
  commitsParserOptions,
  commitsRetrieverOptions,
  commitsValidatorOptions,
  directoryPath = process.cwd(),
  isDryRun = false,
  isUpdateReadme = true,
  rootScopeOptions,
  onError = logError,
}: ReleasePackagesOptions<T> = {}): Promise<void> {
  const directoriesReader = new DirectoriesReader({
    directoryPath,
    rootScopeOptions,
    onError,
  });
  const directoryPathByScopeMap = directoriesReader.directoryPathByScopeMap;
  if (!directoryPathByScopeMap.size) throw new Error('No scopes found in the specified directory');

  const allowedCommitScopes = [...getAllowedCommitScopes(
    directoriesReader.scopes,
    commitsValidatorOptions?.allowedCommitScopes,
  )];

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

  // for each scope in commitsByScopeMap, add a key-value pair with key directoryPath and value the value of its corresponding value in directoryPathByScopeMap

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
