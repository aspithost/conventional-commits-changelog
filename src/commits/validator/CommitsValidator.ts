import { COMMIT_TYPES } from '@/presets/constants/writer.js';
import { createCommitSchema, type CommitSchema } from '@/schemas/commit.js';
import { ScopesReader } from '@/scopes/ScopesReader.js';
import type { ParsedCommits } from '../parser/CommitsParser.js';

export type ValidatedCommit<T extends string, U extends string> = CommitSchema<T, U>;
export type ValidatedCommits<T extends string, U extends string> = Iterable<ValidatedCommit<T, U>>;

export const DEFAULT_ALLOWED_TYPES = COMMIT_TYPES.map((entry) => entry.type);
export type DefaultAllowedTypes = typeof DEFAULT_ALLOWED_TYPES[number];

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

  *getValidatedCommits(
    parsedCommits: ParsedCommits,
  ): ValidatedCommits<T, U> {
    for (const parsedCommit of parsedCommits) {
      const validationResult = this.commitSchema.safeParse(parsedCommit);
      if (!validationResult.success) {
        // To-do: Replace with proper logger
        console.error('Validation error, did not yield commit', {
          commit: parsedCommit,
          error: validationResult.error,
        });
        continue;
      }
      yield validationResult.data;
    }
  }
}
