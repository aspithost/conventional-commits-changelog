import type { z } from 'zod';

import type { ErrorHandler } from '../../../utils/error/logError.js';
import type { OnError } from '../../../utils/error/types/error.js';
import type { ParsedCommits } from '../../parse-commits/CommitsParser.js';

export type BaseCommitsValidatorOptions = OnError;

export class BaseCommitsValidator {
  readonly #onError?: ErrorHandler | null;

  constructor({ onError }: BaseCommitsValidatorOptions = {}) {
    this.#onError = onError;
  }

  protected *validateCommitsBySchema<Schema extends z.ZodType>(
    parsedCommits: ParsedCommits,
    schema: Schema,
  ): Iterable<z.infer<Schema>> {
    for (const commit of parsedCommits) {
      const result = schema.safeParse(commit);

      if (!result.success) {
        this.#onError?.('Validation error, did not yield commit', {
          commit,
          error: result.error,
        });
        continue;
      }

      yield result.data;
    }
  }
}
