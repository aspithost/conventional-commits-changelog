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

export class CommitsGrouper<T extends string, U extends string> {
  readonly #commitsByScopeMap: CommitsByScopeMap<T, U>;
  readonly #scopesInformation: ScopesInformation<T>;
  readonly #rootScopeName: ScopeKey<T>;

  constructor(
    validatedCommits: ValidatedCommitsWithScope<T, U>,
    {
      scopesInformation = ScopesReader.withPackagesDirectory<T>().scopesInformation,
      rootScopeName = 'root',
    }: GroupCommitsByScopeOptions<T> = {},
  ) {
    this.#scopesInformation = scopesInformation;
    this.#rootScopeName = rootScopeName;
    this.#commitsByScopeMap = new Map();
    this.#initializeScopesMap();
    this.#groupCommitsByScope(validatedCommits);
  }

  get scopes(): MapIterator<ScopeKey<T>> {
    return this.#commitsByScopeMap.keys();
  }

  get commitsByScope(): CommitsByScopeMap<T, U> {
    return this.#commitsByScopeMap;
  }

  #groupCommitsByScope(validatedCommits: ValidatedCommitsWithScope<T, U>): void {
    for (const commit of validatedCommits) {
      const scopeName = commit.scope ?? this.#rootScopeName;
      const commitsByScope = this.#commitsByScopeMap.get(scopeName);
      if (!commitsByScope) continue;
      commitsByScope.commits.push(commit);
    }
  }

  #initializeScopesMap(): void {
    // Note: Initializes a key of 'root' on Map to group commits without a scope
    this.#commitsByScopeMap.set(this.#rootScopeName, {
      directoryPath: process.cwd(),
      commits: [],
    });
    for (const { scopeName, directoryPath } of this.#scopesInformation) {
      this.#commitsByScopeMap.set(scopeName, {
        directoryPath,
        commits: [],
      });
    }
  }
}
