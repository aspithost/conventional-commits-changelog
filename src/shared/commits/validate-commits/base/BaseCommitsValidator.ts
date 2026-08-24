import type { OnError } from '@/shared/types/error.js';
import { logError, type ErrorHandler } from '@/shared/utils/error/logError.js';
import type z from 'zod';
import type { ParsedCommits } from '../../parse-commits/CommitsParser.js';

export type BaseCommitsValidatorOptions = OnError;

export class BaseCommitsValidator {
  readonly #onError: ErrorHandler;

  constructor({ onError = logError }: BaseCommitsValidatorOptions = {}) {
    this.#onError = onError;
  }

  protected *validateCommitsBySchema<Schema extends z.ZodType>(
    parsedCommits: ParsedCommits,
    schema: Schema,
  ): Iterable<z.infer<Schema>> {
    for (const commit of parsedCommits) {
      const result = schema.safeParse(commit);

      if (!result.success) {
        this.#onError('Validation error, did not yield commit', {
          commit,
          error: result.error,
        });
        continue;
      }

      yield result.data;
    }
  }
}
