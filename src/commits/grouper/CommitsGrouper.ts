import type { ValidatedCommits } from '@/commits/validator/CommitsValidator.js';
import type { CommitSchema } from '@/schemas/commit.js';

export type CommitsByScope<T extends string, U extends string> = Partial<Record<T, CommitSchema<T, U>[]>>;

export class CommitsGrouper<T extends string, U extends string> {
  private readonly commitsByScope: CommitsByScope<T, U> = {};
  private constructor() {}

  static async init<T extends string, U extends string>(
    commits: ValidatedCommits<T, U>
  ): Promise<CommitsGrouper<T, U>> {
    const instance = new CommitsGrouper<T, U>();
    await instance.groupCommitsByScope(commits);
    return instance;
  }

  getCommitsByScope(scope: T): CommitSchema<T, U>[] | undefined {
    return this.commitsByScope[scope];
  }

  private async groupCommitsByScope(validatedCommits: ValidatedCommits<T, U>): Promise<void> {
    for await (const validatedCommit of validatedCommits) {
      const { scope } = validatedCommit;
      if (!(scope in this.commitsByScope)) {
        this.commitsByScope[scope] = [validatedCommit];
      } else if (this.commitsByScope[scope]) {
        this.commitsByScope[scope].push(validatedCommit);
      }
    }
  }
}
