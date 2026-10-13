import type { CommitsByScopeMap } from '../../commits/group-commits/CommitsGrouper.js';
import type { DirectoryPathByScopeMap } from '../../read-directories/DirectoriesReader.js';
import { release } from '../../release/release.js';
import type { BaseReleaseOptions } from '../../release/types/release.js';

export async function releaseByScope<T extends string>(
  directoryPathByScopeMap: DirectoryPathByScopeMap<string>,
  commitsByScopeMap: CommitsByScopeMap<T>,
  {
    changelogWriterOptions,
    isDryRun,
    isUpdateReadme,
    onError,
  }: Partial<BaseReleaseOptions> = {},
): Promise<PromiseSettledResult<void>[]> {
  const releasePromises: Promise<void>[] = [];

  // Loop over commits by scope
  for (const [scopeName, commitsByScope] of commitsByScopeMap) {
    // For each scope, find entry with directory path in directoryPathByScopeMap
    const directoryPathByScopeEntry = directoryPathByScopeMap.get(scopeName);

    // Note: edge case, validated commits are filtered by found and allowed scopes
    if (!directoryPathByScopeEntry) continue;

    // Call release for each scope with its corresponding directory path and commits
    const { directoryPath } = directoryPathByScopeEntry;
    releasePromises.push(release({
      changelogWriterOptions,
      commits: commitsByScope,
      directoryPath,
      isDryRun,
      isUpdateReadme,
      onError,
    }));
  }

  const releasePackagesResults = await Promise.allSettled(releasePromises);
  return releasePackagesResults;
}
