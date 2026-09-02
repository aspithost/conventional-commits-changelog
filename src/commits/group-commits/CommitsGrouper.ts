import type { ValidatedCommit } from '../validate-commits/types/commit.js';

type ValidatedCommits = ValidatedCommit<string, string>[];
export type CommitsByScopeMap = Map<string, ValidatedCommits>;

export class CommitsGrouper {
  readonly #commitsByScopeMap: CommitsByScopeMap;

  constructor(
    validatedCommits: Iterable<ValidatedCommit<string, string>>,
  ) {
    this.#commitsByScopeMap = this.#groupCommitsByScope(validatedCommits);
  }

  get commitsByScopeMap(): CommitsByScopeMap {
    return this.#commitsByScopeMap;
  }

  #groupCommitsByScope(
    validatedCommits: Iterable<ValidatedCommit<string, string>>,
  ): CommitsByScopeMap {
    const commitsByScopeMap: CommitsByScopeMap = new Map();

    for (const commit of validatedCommits) {
      const { scope } = commit;
      if (!scope) continue;

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
