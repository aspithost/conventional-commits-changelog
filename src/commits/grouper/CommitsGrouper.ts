import type { ValidatedCommits } from '@/commits/validator/CommitsValidator.js';
import type { CommitSchema } from '@/schemas/commit.js';

export type CommitsByScope<T extends string, U extends string> = Map<T | 'root', CommitSchema<T, U>[]>;

export class CommitsGrouper<T extends string, U extends string> {
  private readonly commitsByScope: CommitsByScope<T, U> = new Map();
  private constructor() {}

  static async init<T extends string, U extends string>(
    commits: ValidatedCommits<T, U>
  ): Promise<CommitsGrouper<T, U>> {
    const instance = new CommitsGrouper<T, U>();
    await instance.groupCommitsByScope(commits);
    return instance;
  }

  getCommitsByScope(scope: T): CommitSchema<T, U>[] | undefined {
    return this.commitsByScope.get(scope);
  }

  private async groupCommitsByScope(validatedCommits: ValidatedCommits<T, U>): Promise<void> {
    for await (const validatedCommit of validatedCommits) {
      const { scope } = validatedCommit;
      if (!scope) {
        console.warn('Commit without scope, adding commit to root scope');
        this.addCommitToScope('root', validatedCommit);
        continue;
      }
      this.addCommitToScope(scope, validatedCommit);
    }
  }

  private addCommitToScope(scope: T | 'root', commit: CommitSchema<T, U>): void {
    const existingCommits = this.commitsByScope.get(scope);
    if (existingCommits) {
      existingCommits.push(commit);
    } else {
      this.commitsByScope.set(scope, [commit]);
    }
  }
}
