import type { ValidatedCommit } from '../validate-commits/CommitsValidator.js';

interface CommitsGrouperOptions {
  validatedCommits: Iterable<ValidatedCommit>;
}

export type CommitsByScopeMap = Map<string, Iterable<ValidatedCommit>>;

export class CommitsGrouper {
  readonly #commitsByScopeMap: CommitsByScopeMap;

  constructor({
    validatedCommits,
  }: CommitsGrouperOptions) {
    this.#commitsByScopeMap = this.#groupCommitsByScope(validatedCommits);
  }

  get commitsByScopeMap(): CommitsByScopeMap {
    return this.#commitsByScopeMap;
  }

  #groupCommitsByScope(
    validatedCommits: Iterable<ValidatedCommit>,
  ): CommitsByScopeMap {
    const commitsByScopeMap: CommitsByScopeMap = new Map();

    for (const commit of validatedCommits) {
      const { scope } = commit;
      if (!scope) continue;

      const commitsByScope = commitsByScopeMap.get(scope);
      if (!commitsByScope) {
        commitsByScopeMap.set(scope, [commit]);
      } else {
        commitsByScopeMap.set(scope, [...commitsByScope, commit]);
      }
    }

    return commitsByScopeMap;
  }
}
