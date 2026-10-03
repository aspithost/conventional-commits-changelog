import { DEFAULT_ALLOWED_TYPES } from '../constants/commit.js';
import type { ParsedCommits } from '../parse-commits/CommitsParser.js';

import {
  BaseCommitsValidator,
  type BaseCommitsValidatorOptions,
} from './base/BaseCommitsValidator.js';
import { createCommitSchemaWithType } from './schemas/commit.js';
import type { ValidatedCommitWithDefaultType } from './types/commit.js';

export type CommitsValidatorOptions = BaseCommitsValidatorOptions;

export class CommitsValidator extends BaseCommitsValidator {
  constructor({ onError }: CommitsValidatorOptions = {}) {
    super({ onError });
  }

  *validateCommits(
    parsedCommits: ParsedCommits,
  ): Iterable<ValidatedCommitWithDefaultType> {
    yield* this.validateCommitsBySchema(
      parsedCommits,
      createCommitSchemaWithType(DEFAULT_ALLOWED_TYPES),
    );
  }
}
