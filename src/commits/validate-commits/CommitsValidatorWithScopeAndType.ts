import type { ParsedCommits } from '../parse-commits/CommitsParser.js';
import { BaseCommitsValidator, type BaseCommitsValidatorOptions } from './base/BaseCommitsValidator.js';
import { createCommitSchemaWithScopeAndType } from './schemas/commit.js';
import type { ValidatedCommitWithScopeAndType } from './types/commit.js';
import type { AllowedCommitScopes, AllowedCommitTypes } from './types/options.js';

type CommitsValidatorWithScopeAndTypeOptions<
  T extends string,
  U extends string,
> = BaseCommitsValidatorOptions & AllowedCommitScopes<T> & AllowedCommitTypes<U>;

export class CommitsValidatorWithScopeAndType<
  T extends string,
  U extends string,
> extends BaseCommitsValidator {
  readonly #allowedCommitScopes: readonly T[];
  readonly #allowedCommitTypes: readonly U[];

  constructor({
    allowedCommitScopes,
    allowedCommitTypes,
    onError,
  }: CommitsValidatorWithScopeAndTypeOptions<T, U>) {
    super({ onError });
    this.#allowedCommitScopes = allowedCommitScopes;
    this.#allowedCommitTypes = allowedCommitTypes;
  }

  *validateCommits(
    parsedCommits: ParsedCommits,
  ): Iterable<ValidatedCommitWithScopeAndType<T, U>> {
    yield* this.validateCommitsBySchema(
      parsedCommits,
      createCommitSchemaWithScopeAndType(
        this.#allowedCommitScopes,
        this.#allowedCommitTypes,
      ),
    );
  }
}
