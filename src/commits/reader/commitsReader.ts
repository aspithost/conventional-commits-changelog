import type { ValidatedCommits } from '@/commits/validator/CommitsValidator.js';
import type { CommitSchema } from '@/schemas/commit.js';

export type CommitsByScope<T extends string, U extends string> = Partial<Record<T, CommitSchema<T, U>[]>>;

export class CommitsReader<T extends string, U extends string> {
  private commitsByScope: CommitsByScope<T, U> = {};

  getCommitsByScope(scope: T): CommitSchema<T, U>[] | undefined {
    return this.commitsByScope[scope];
  }

  async groupCommitsByScope(validatedCommits: ValidatedCommits<T, U>): Promise<void> {
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
