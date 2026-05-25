import { retrieveValidatedCommits } from './retrieveValidatedCommits.js';

import { CommitsParser } from './parse-commits/CommitsParser.js';
import { CommitsRetriever } from './retrieve-commits/CommitsRetriever.js';
import { validateCommits } from './validate-commits/validateCommits.js';

const PARSED_COMMITS = ['parsed-commit-one', 'parsed-commit-two'];
vi.mock('./parse-commits/CommitsParser.js', () => {
  const CommitsParser = vi.fn(class {
    getParsedCommits = vi.fn(() => PARSED_COMMITS);
  });
  return { CommitsParser };
});
vi.mock('./retrieve-commits/CommitsRetriever.js', () => {
  const CommitsRetriever = vi.fn(class {
    getRawCommits = vi.fn();
  });
  return { CommitsRetriever };
});
vi.mock('./validate-commits/validateCommits.js', () => ({
  validateCommits: vi.fn(),
}));

const BASE_OPTIONS = {
  allowedScopes: ['ui', 'api'] as const,
  allowedTypes: ['feat', 'fix'] as const,
};

describe('retrieveValidatedCommits', () => {
  describe('retrieve commits', () => {
    it('retrieve parsed commits with commitsRetrieverOptions', () => {
      const commitsRetrieverOptions = { from: 'abc123' };
      retrieveValidatedCommits({ ...BASE_OPTIONS, commitsRetrieverOptions });
      expect(CommitsRetriever).toHaveBeenCalledWith(commitsRetrieverOptions);
    });

    it('retrieve parsed commits with commitsParserOptions', () => {
      const commitsParserOptions = { fieldPattern: /foo/ };
      retrieveValidatedCommits({ ...BASE_OPTIONS, commitsParserOptions });
      expect(CommitsParser).toHaveBeenCalledWith(commitsParserOptions);
    });
  });

  describe('validate commits', () => {
    it.each([
      { allowedScopes: BASE_OPTIONS.allowedScopes },
      { allowedTypes: BASE_OPTIONS.allowedTypes },
      { allowedScopes: BASE_OPTIONS.allowedScopes, allowedTypes: BASE_OPTIONS.allowedTypes },
    ])('should validate commits with allowed scopes and/or types', (options) => {
      retrieveValidatedCommits(options);

      expect(validateCommits).toHaveBeenCalledWith(
        PARSED_COMMITS,
        options,
      );
    });

    it('should validate commits without scopes and types if not provided', () => {
      retrieveValidatedCommits();

      expect(validateCommits).toHaveBeenCalledWith(PARSED_COMMITS);
    });
  });
});
