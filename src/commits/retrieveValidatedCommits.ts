import type { OnError } from '../utils/error/types/error.js';

import { CommitsParser, type CommitsParserOptions } from './parse-commits/CommitsParser.js';
import {
  CommitsRetriever,
  type CommitsRetrieverOptions,
} from './retrieve-commits/CommitsRetriever.js';
import { CommitsValidator } from './validate-commits/CommitsValidator.js';
import { CommitsValidatorWithScope } from './validate-commits/CommitsValidatorWithScope.js';
import {
  CommitsValidatorWithScopeAndType,
} from './validate-commits/CommitsValidatorWithScopeAndType.js';
import { CommitsValidatorWithType } from './validate-commits/CommitsValidatorWithType.js';
import type {
  ValidatedCommit,
  ValidatedCommitWithDefaultType,
  ValidatedCommitWithScope,
  ValidatedCommitWithScopeAndType,
  ValidatedCommitWithType,
} from './validate-commits/types/commit.js';
import type {
  AllowedCommitScopes,
  AllowedCommitTypes,
  CommitsValidatorOptions,
} from './validate-commits/types/options.js';

export interface RetrieveCommitsOptions<
  T extends string,
  U extends string,
> {
  /**
   * Options that control how the library parses raw commits.
   *
   * @see {@link CommitsParserOptions} for the available options.
   */
  commitsParserOptions?: CommitsParserOptions;
  /**
   * Options that control how the library retrieves raw commits from git.
   *
   * @see {@link CommitsRetrieverOptions} for the available options.
   */
  commitsRetrieverOptions?: CommitsRetrieverOptions;
  /**
   * Allows users to validate commits based on commit scopes and types.
   *
   * @see {@link CommitsValidatorOptions} for the available options.
   */
  commitsValidatorOptions?: CommitsValidatorOptions<T, U>;
}

type RetrieveCommitsOptionsWithOnError<
  T extends string,
  U extends string,
> = RetrieveCommitsOptions<T, U> & OnError;

type OptionsWithoutValidatorOptions = Omit<
  RetrieveCommitsOptionsWithOnError<string, string>, 'commitsValidatorOptions'
>;
type OptionsWithoutValidatorOptionsWithScope<
  T extends string,
> = OptionsWithoutValidatorOptions & {
  commitsValidatorOptions: AllowedCommitScopes<T>;
};
type OptionsWithoutValidatorOptionsWithType<
  U extends string,
> = OptionsWithoutValidatorOptions & {
  commitsValidatorOptions: AllowedCommitTypes<U>;
};
type OptionsWithoutValidatorOptionsWithScopeAndType<
  T extends string,
  U extends string,
> = OptionsWithoutValidatorOptions & {
  commitsValidatorOptions: AllowedCommitScopes<T> & AllowedCommitTypes<U>;
};
type OptionsWithValidatorOptions<
  T extends string,
  U extends string,
> = OptionsWithoutValidatorOptions & {
  commitsValidatorOptions?: CommitsValidatorOptions<T, U>;
};

export function retrieveValidatedCommits(
  options?: OptionsWithoutValidatorOptions,
): Iterable<ValidatedCommitWithDefaultType>;
export function retrieveValidatedCommits<T extends string>(
  options: OptionsWithoutValidatorOptionsWithScope<T>,
): Iterable<ValidatedCommitWithScope<T>>;
export function retrieveValidatedCommits<T extends string>(
  options: OptionsWithoutValidatorOptionsWithType<T>,
): Iterable<ValidatedCommitWithType<T>>;
export function retrieveValidatedCommits<T extends string, U extends string>(
  options: OptionsWithoutValidatorOptionsWithScopeAndType<T, U>,
): Iterable<ValidatedCommitWithScopeAndType<T, U>>;
export function retrieveValidatedCommits<T extends string, U extends string>(
  options: OptionsWithValidatorOptions<T, U>,
): Iterable<ValidatedCommit<T, U>>;
export function* retrieveValidatedCommits< T extends string = string, U extends string = string>({
  commitsParserOptions,
  commitsRetrieverOptions,
  commitsValidatorOptions,
  onError,
}: RetrieveCommitsOptions<T, U> & OnError = {}): Iterable<ValidatedCommit<T, U>>
{
  const rawCommits = new CommitsRetriever(commitsRetrieverOptions).getRawCommits();
  const parsedCommits = new CommitsParser(commitsParserOptions).getParsedCommits(rawCommits);

  const { allowedCommitScopes, allowedCommitTypes } = commitsValidatorOptions ?? {};
  if (allowedCommitScopes && allowedCommitTypes) {
    yield* new CommitsValidatorWithScopeAndType({
      allowedCommitScopes,
      allowedCommitTypes,
      onError,
    }).validateCommits(parsedCommits);
  } else if (allowedCommitScopes) {
    yield* new CommitsValidatorWithScope({
      allowedCommitScopes,
      onError,
    }).validateCommits(parsedCommits);
  } else if (allowedCommitTypes) {
    yield* new CommitsValidatorWithType({
      allowedCommitTypes,
      onError,
    }).validateCommits(parsedCommits);
  } else {
    yield* new CommitsValidator({ onError }).validateCommits(parsedCommits);
  }
}
