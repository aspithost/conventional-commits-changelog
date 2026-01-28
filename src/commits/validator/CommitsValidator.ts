import { COMMIT_TYPES } from '@/presets/constants/writer.js';
import { createCommitSchema, type CommitSchema } from '@/schemas/commit.js';
import { ScopesReader } from '@/scopes/reader/ScopesReader.js';
import type { ParsedCommits } from '../parser/CommitsParser.js';

export type ValidatedCommits<T extends string, U extends string> = AsyncGenerator<CommitSchema<T, U>, void, unknown>;

const DEFAULT_ALLOWED_TYPES = COMMIT_TYPES.map((entry) => entry.type);
type DefaultAllowedTypes = typeof DEFAULT_ALLOWED_TYPES[number];

export class CommitsValidator<T extends string, U extends string> {
  private readonly commitSchema: ReturnType<typeof createCommitSchema<T, U>>;

  constructor(
    allowedScopes: readonly T[],
    allowedTypes: readonly U[],
  ) {
    this.commitSchema = createCommitSchema(allowedScopes, allowedTypes);
  }

  static withDefaultScopes<T extends string>(
    allowedTypes: readonly T[],
  ): CommitsValidator<string, T> {
    return new CommitsValidator(new ScopesReader().scopes, allowedTypes);
  }

  static withDefaultTypes<T extends string>(
    allowedScopes: readonly T[],
  ): CommitsValidator<T, DefaultAllowedTypes> {
    return new CommitsValidator(allowedScopes, DEFAULT_ALLOWED_TYPES);
  }

  static withDefaultScopesAndTypes(): CommitsValidator<string, DefaultAllowedTypes> {
    return new CommitsValidator(new ScopesReader().scopes, DEFAULT_ALLOWED_TYPES);
  }

  async *getValidatedCommits(
    parsedCommits: ParsedCommits,
  ): ValidatedCommits<T, U> {
    for await (const parsedCommit of parsedCommits) {
      const validationResult = this.commitSchema.safeParse(parsedCommit);
      if (!validationResult.success) {
        console.error('Validation error, did not yield commit', {
          commit: parsedCommit,
          error: validationResult.error,
        });
        continue;
      }
      yield validationResult.data;
    }
  }

  async *getValidatedCommitsByScope(
    validatedCommits: ValidatedCommits<T, U>,
    scopeFilter: T,
  ): ValidatedCommits<T, U> {
    for await (const validatedCommit of validatedCommits) {
      const { scope } = validatedCommit;
      if (!scope && scopeFilter === 'root') {
        console.warn('No scope found on commit, adding to root scope');
        yield validatedCommit;
      } else if (scope === scopeFilter) {
        yield validatedCommit;
      }
    }
  }
}
