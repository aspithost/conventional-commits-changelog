import type { OnError } from '../../utils/error/types/error.js';
import {
  CommitsParser,
  type CommitsParserOptions,
} from '../parse-commits/CommitsParser.js';
import {
  CommitsRetriever,
  type CommitsRetrieverOptions,
} from '../retrieve-commits/CommitsRetriever.js';
import type { TagRetrieverOptions } from '../retrieve-tags/schemas/tagRetrieverOptions.js';
import { TagRetriever } from '../retrieve-tags/TagRetriever.js';
import {
  CommitsValidator,
  type ValidatedCommit,
} from '../validate-commits/CommitsValidator.js';

export interface RetrieveValidatedCommitsOptions {
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
   * Options that control how the library retrieves the latest tag from git.
   *
   * @see {@link TagRetrieverOptions} for the available options.
   */
  tagRetrieverOptions?: TagRetrieverOptions;
}

export function retrieveValidatedCommits({
  commitsParserOptions,
  commitsRetrieverOptions,
  tagRetrieverOptions,
  onError,
}: RetrieveValidatedCommitsOptions & OnError = {}): Iterable<ValidatedCommit> {
  const rawCommits = new CommitsRetriever({
    ...commitsRetrieverOptions,
    from: commitsRetrieverOptions?.from ?? new TagRetriever(tagRetrieverOptions).getLatestTag(),
  }).getRawCommits();
  const parsedCommits = new CommitsParser(commitsParserOptions).getParsedCommits(rawCommits);
  const validatedCommits = new CommitsValidator({
    onError,
  }).getValidatedCommits(parsedCommits);
  return validatedCommits;
}
