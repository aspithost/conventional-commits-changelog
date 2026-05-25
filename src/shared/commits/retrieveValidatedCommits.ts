import { CommitsParser, type CommitsParserOptions } from './parse-commits/CommitsParser.js';
import { CommitsRetriever, type CommitsRetrieverOptions } from './retrieve-commits/CommitsRetriever.js';
import { validateCommits } from './validate-commits/validateCommits.js';

export interface RetrieveCommitsOptions<T extends string, U extends string> {
  allowedScopes?: readonly T[];
  allowedTypes?: readonly U[];
  commitsParserOptions?: CommitsParserOptions,
  commitsRetrieverOptions?: CommitsRetrieverOptions,
}

export function retrieveValidatedCommits<T extends string, U extends string>({
  allowedScopes,
  allowedTypes,
  commitsParserOptions,
  commitsRetrieverOptions,
}: RetrieveCommitsOptions<T, U> = {}) {
  const parsedCommits = new CommitsParser(commitsParserOptions).getParsedCommits(
    new CommitsRetriever(commitsRetrieverOptions).getRawCommits(),
  );
  if (allowedScopes && allowedTypes) {
    return validateCommits(parsedCommits, { allowedScopes, allowedTypes });
  } else if (allowedScopes) {
    return validateCommits(parsedCommits, { allowedScopes });
  } else if (allowedTypes) {
    return validateCommits(parsedCommits, { allowedTypes });
  }
  return validateCommits(parsedCommits);
}
