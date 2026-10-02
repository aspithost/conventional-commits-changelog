import type { ValidatedCommitWithScope, ValidatedCommitWithScopeAndType } from '../validate-commits/types/commit.js';

type CommitWithScope<
  T extends string,
> = ValidatedCommitWithScope<T> | ValidatedCommitWithScopeAndType<T, string>;

export type CommitsByScopeMap<T extends string> = Map<T, CommitWithScope<T>[]>;

export class CommitsGrouper<T extends string> {
  readonly #allowedCommitScopes: Set<T>;
  readonly #commitsByScopeMap: CommitsByScopeMap<T>;

  constructor(
    validatedCommits: Iterable<CommitWithScope<T>>,
    allowedCommitScopes: Set<T>,
  ) {
    this.#allowedCommitScopes = allowedCommitScopes;
    this.#commitsByScopeMap = this.#groupCommitsByScope(validatedCommits);
  }

  get commitsByScopeMap(): CommitsByScopeMap<T> {
    return this.#commitsByScopeMap;
  }

  #groupCommitsByScope(
    validatedCommits: Iterable<CommitWithScope<T>>,
  ): CommitsByScopeMap<T> {
    const commitsByScopeMap: CommitsByScopeMap<T> = new Map();

    for (const commit of validatedCommits) {
      const { scope } = commit;
      if (!scope || !this.#allowedCommitScopes.has(scope)) continue;

      const commitsByScope = commitsByScopeMap.get(scope);
      if (!commitsByScope) {
        commitsByScopeMap.set(scope, [commit]);
      } else {
        commitsByScope.push(commit);
      }
    }

    return commitsByScopeMap;
  }
}
