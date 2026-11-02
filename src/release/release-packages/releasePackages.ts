import { retrieveValidatedCommits } from '../../commits/utils/retrieveValidatedCommits.js';
import { DirectoriesReader } from '../../read-directories/DirectoriesReader.js';
import { logError } from '../../utils/error/logError.js';
import { bumpVersion } from '../../version/bumpVersion.js';
import { createChangelogWriter } from '../../write-changelog/utils/createChangelogWriter.js';
import { determineReleaseType } from '../utils/determineReleaseType.js';

import { CommitsGrouper } from './group-commits/CommitsGrouper.js';
import type { ReleasePackagesOptions } from './types/releasePackages.js';
import { logRejectedPromises } from './utils/logRejectedPromises.js';

/**
 * Releases packages whose commit scopes map to package directories and whose commits
 * warrant a release. The function reads package directories, maps commit scopes to
 * packages, and releases each eligible package with its own commits.
 *
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
export async function releasePackages({
  changelogWriterOptions,
  commitsParserOptions,
  commitsRetrieverOptions,
  directoriesReaderOptions = {
    directoryPath: process.cwd(),
  },
  isDryRun = false,
  isUpdateReadme = true,
  tagRetrieverOptions,
  onError = logError,
}: ReleasePackagesOptions = {}): Promise<void> {
  // Read package directories and map package.json name to directory path
  const { directoryPath } = directoriesReaderOptions;
  const directoriesReader = new DirectoriesReader({
    directoryPath,
  });
  const { packagesDirectoriesMap } = directoriesReader;
  if (!packagesDirectoriesMap.size) {
    throw new Error('No packages with a valid package.json found in the specified directory');
  }

  // Retrieve validated commits
  const validatedCommitsIterator = retrieveValidatedCommits({
    commitsParserOptions,
    commitsRetrieverOptions,
    tagRetrieverOptions,
    onError,
  });

  // Groups commits by commit scope
  const commitsGrouper = new CommitsGrouper({
    validatedCommits: validatedCommitsIterator,
  });
  const { commitsByScopeMap } = commitsGrouper;

  const releasePromises: Promise<void>[] = [];
  const changelogWriter = createChangelogWriter(changelogWriterOptions);

  // Loops over commits by scope
  for (const [scopeName, commitsByScope] of commitsByScopeMap) {
    // Checks if the scope maps to a valid package directory
    const { directoryPath } = packagesDirectoriesMap.get(scopeName) ?? {};
    if (!directoryPath) continue;

    // Determine release type for scope
    const releaseType = determineReleaseType(commitsByScope);
    if (!releaseType) continue;
    if (isDryRun) {
      console.log(
        `Dry run: would release package at ${directoryPath} with release type ${releaseType}`,
      );
      continue;
    }

    // Bump version for the package
    const newVersion = bumpVersion(directoryPath, releaseType, {
      isUpdateReadme,
      onError,
    });

    // Add changelog writer promise to promises array and continue with the next scope
    releasePromises.push(changelogWriter.writeChangelog(
      directoryPath,
      newVersion,
      releaseType,
      commitsByScope,
    ));
  }

  // Await all writeChangelog operations
  const releasePackagesResults = await Promise.allSettled(releasePromises);

  if (onError) {
    logRejectedPromises(releasePackagesResults, onError, 'A package release failed.');
  }
}
