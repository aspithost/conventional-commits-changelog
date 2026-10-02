import type { ParsedCommits } from '../parse-commits/CommitsParser.js';
import { BaseCommitsValidator, type BaseCommitsValidatorOptions } from './base/BaseCommitsValidator.js';
import { createCommitSchemaWithType } from './schemas/commit.js';
import type { ValidatedCommitWithType } from './types/commit.js';
import type { AllowedCommitTypes } from './types/options.js';

type CommitsValidatorWithTypeOptions<
  T extends string,
> = BaseCommitsValidatorOptions & AllowedCommitTypes<T>;

export class CommitsValidatorWithType<T extends string> extends BaseCommitsValidator {
  readonly #allowedCommitTypes: Set<T>;

  constructor({
    allowedCommitTypes,
    onError,
  }: CommitsValidatorWithTypeOptions<T>) {
    super({ onError });
    this.#allowedCommitTypes = allowedCommitTypes;
  }

  *validateCommits(
    parsedCommits: ParsedCommits,
  ): Iterable<ValidatedCommitWithType<T>> {
    yield* this.validateCommitsBySchema(
      parsedCommits,
      createCommitSchemaWithType([...this.#allowedCommitTypes]),
    );
  }
}
