import type { ParsedCommits } from '../parse-commits/CommitsParser.js';

import {
  BaseCommitsValidator,
  type BaseCommitsValidatorOptions,
} from './base/BaseCommitsValidator.js';
import { createCommitSchemaWithScope } from './schemas/commit.js';
import type { ValidatedCommitWithScope } from './types/commit.js';
import type { AllowedCommitScopes } from './types/options.js';

export type CommitsValidatorWithScopeOptions<
  T extends string,
> = BaseCommitsValidatorOptions & AllowedCommitScopes<T>;

export class CommitsValidatorWithScope<T extends string> extends BaseCommitsValidator {
  readonly #allowedCommitScopes: Set<T>;

  constructor({
    allowedCommitScopes,
    onError,
  }: CommitsValidatorWithScopeOptions<T>) {
    super({ onError });
    this.#allowedCommitScopes = allowedCommitScopes;
  }

  *validateCommits(
    parsedCommits: ParsedCommits,
  ): Iterable<ValidatedCommitWithScope<T>> {
    yield* this.validateCommitsBySchema(
      parsedCommits,
      createCommitSchemaWithScope([...this.#allowedCommitScopes]),
    );
  }
}
