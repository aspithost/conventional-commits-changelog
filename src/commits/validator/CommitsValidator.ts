import { createCommitSchema, type CommitSchema } from '@/schemas/commit.js';
import type { ParsedCommits } from '../parser/CommitsParser.js';

export type ValidatedCommits<T extends string, U extends string> = AsyncGenerator<CommitSchema<T, U>, void, unknown>;

export class CommitsValidator<T extends string, U extends string>  {
  private readonly commitSchema: ReturnType<typeof createCommitSchema<T, U>>;

  constructor(
    allowedScopes: readonly T[],
    allowedTypes: readonly U[],
  ) {
    this.commitSchema = this.createCommitSchema(allowedScopes, allowedTypes);
  }

  async *getValidatedCommits(
    parsedCommits: ParsedCommits,
  ): ValidatedCommits<T, U> {
    for await (const parsedCommit of parsedCommits) {
      const validationResult = this.commitSchema.safeParse(parsedCommit);
      if (!validationResult.success) {
        console.error('Validation error', validationResult.error);
        continue;
      }
      yield validationResult.data;
    }
  }

  private createCommitSchema(
    allowedScopes: readonly T[],
    allowedTypes: readonly U[],
  ): ReturnType<typeof createCommitSchema<T, U>> {
    return createCommitSchema<T, U>(
      allowedScopes,
      allowedTypes,
    );
  }
}
