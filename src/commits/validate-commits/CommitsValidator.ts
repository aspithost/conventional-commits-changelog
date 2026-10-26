import type { ErrorHandler } from '../../utils/error/logError.js';
import type { OnError } from '../../utils/error/types/error.js';
import type { ParsedCommits } from '../parse-commits/CommitsParser.js';

import { type CommitSchema, commitSchema } from './schemas/commit.js';

export type ValidatedCommit = CommitSchema;

export class CommitsValidator {
  readonly #onError?: ErrorHandler | null;

  constructor({
    onError,
  }: OnError = {}) {
    this.#onError = onError;
  }

  *getValidatedCommits(
    parsedCommits: ParsedCommits,
  ): Iterable<ValidatedCommit> {
    for (const commit of parsedCommits) {
      const result = commitSchema.safeParse(commit);

      if (!result.success) {
        this.#onError?.('Validation error, did not yield commit', result.error);
        continue;
      }

      yield result.data;
    }
  }
}
