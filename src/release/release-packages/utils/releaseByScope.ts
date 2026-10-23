import type { CommitsByScopeMap } from '../../../commits/group-commits/CommitsGrouper.js';
import type { DirectoryPathByScopeMap } from '../../../read-directories/types/directoriesReader.js';
import type { OnError } from '../../../utils/error/types/error.js';
import { bumpVersion } from '../../../version/bumpVersion.js';
import { createChangelogWriter } from '../../../write-changelog/utils/createChangelogWriter.js';
import type { BaseReleaseOptions } from '../../release/schemas/releaseOptions.js';
import { determineReleaseType } from '../../utils/determineReleaseType.js';

export function releaseByScope<T extends string>(
  directoryPathByScopeMap: DirectoryPathByScopeMap<string>,
  commitsByScopeMap: CommitsByScopeMap<T>,
  {
    changelogWriterOptions,
    isUpdateReadme,
    onError,
  }: Partial<BaseReleaseOptions> & OnError = {},
): Promise<PromiseSettledResult<void>[]> {
  const releasePromises: Promise<void>[] = [];

  // to-do: make note that only one set of remote repository information supported
  const changelogWriter = createChangelogWriter(changelogWriterOptions);

  // Loop over commits by scope
  for (const [scopeName, commitsByScope] of commitsByScopeMap) {
    // For each scope, find entry with directory path in directoryPathByScopeMap
    const directoryPathByScopeEntry = directoryPathByScopeMap.get(scopeName);
    // Note: edge case, validated commits are filtered by found and allowed scopes
    if (!directoryPathByScopeEntry) continue;

    // If commits do not warrant a release, skip this scope
    const releaseType = determineReleaseType(commitsByScope);
    if (!releaseType) continue;

    // Call release for each scope with its corresponding directory path and commits
    const { directoryPath } = directoryPathByScopeEntry;

    const newVersion = bumpVersion(directoryPath, releaseType, {
      isUpdateReadme,
      onError,
    });

    releasePromises.push(changelogWriter.writeChangelog(
      directoryPath,
      newVersion,
      releaseType,
      commitsByScope,
    ));
  }

  return Promise.allSettled(releasePromises);
}
