import { ScopesReader, type ScopesInformation } from '@/shared/scopes/ScopesReader.js';

import type { ValidatedCommitsWithScope, ValidatedCommitWithScope } from '../validate-commits/types/commits.js';

interface CommitsByScope<T extends string, U extends string> {
  directoryPath: string;
  commits: ValidatedCommitWithScope<T, U>[];
}
type ScopeKey<T> = T | 'root';
type CommitsByScopeMap<T extends string, U extends string> = Map<ScopeKey<T>, CommitsByScope<T, U>>;

interface GroupCommitsByScopeOptions<T extends string> {
  scopesInformation?: ScopesInformation<T>;
  rootScopeName?: ScopeKey<T>;
}

export function groupCommitsByScope<T extends string, U extends string>(
  validatedCommits: ValidatedCommitsWithScope<T, U>,
  {
    scopesInformation = ScopesReader.withPackagesDirectory<T>().scopesInformation,
    rootScopeName = 'root',
  }: GroupCommitsByScopeOptions<T> = {},
) {
  const scopesMap = initializeScopesMap(scopesInformation, rootScopeName);
  const scopesMapWithCommits = setScopesMapCommits(scopesMap, validatedCommits, rootScopeName);
  return scopesMapWithCommits;
}

function setScopesMapCommits<T extends string, U extends string>(
  commitsByScopeMap: CommitsByScopeMap<T, U>,
  validatedCommits: ValidatedCommitsWithScope<T, U>,
  rootScopeName: ScopeKey<T>,
): CommitsByScopeMap<T, U> {
  for (const commit of validatedCommits) {
    const scopeName = commit.scope ?? rootScopeName;
    const commitsByScope = commitsByScopeMap.get(scopeName);
    if (!commitsByScope) continue;
    commitsByScope.commits.push(commit);
  }
  return commitsByScopeMap;
}

function initializeScopesMap<T extends string, U extends string>(
  scopesInformation: ScopesInformation<T>,
  rootScopeName: ScopeKey<T> = 'root',
): CommitsByScopeMap<T, U> {
  const commitsByScopeMap: CommitsByScopeMap<T, U> = new Map();
  // Note: Initializes a key of 'root' on Map to group commits without a scope
  commitsByScopeMap.set(rootScopeName, {
    directoryPath: process.cwd(),
    commits: [],
  });
  for (const { scopeName, directoryPath } of scopesInformation) {
    commitsByScopeMap.set(scopeName, {
      directoryPath,
      commits: [],
    });
  }
  return commitsByScopeMap;
}
