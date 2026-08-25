import { retrieveValidatedCommits } from './retrieveValidatedCommits.js';

import { CommitsParser } from './parse-commits/CommitsParser.js';
import { CommitsRetriever } from './retrieve-commits/CommitsRetriever.js';
import { CommitsValidator } from './validate-commits/CommitsValidator.js';
import { CommitsValidatorWithScope } from './validate-commits/CommitsValidatorWithScope.js';
import { CommitsValidatorWithScopeAndType } from './validate-commits/CommitsValidatorWithScopeAndType.js';
import { CommitsValidatorWithType } from './validate-commits/CommitsValidatorWithType.js';

const RAW_COMMITS = ['raw-commit-one', 'raw-commit-two'];
const PARSED_COMMITS = ['parsed-commit-one', 'parsed-commit-two'];
const VALIDATED_COMMITS = ['validated-commit-one', 'validated-commit-two'];

const mockGetRawCommits = vi.fn(() => RAW_COMMITS);
vi.mock('./retrieve-commits/CommitsRetriever.js', () => {
  const CommitsRetriever = vi.fn(class {
    getRawCommits = mockGetRawCommits;
  });
  return { CommitsRetriever };
});

const mockGetParsedCommits = vi.fn(() => PARSED_COMMITS);
vi.mock('./parse-commits/CommitsParser.js', () => {
  const CommitsParser = vi.fn(class {
    getParsedCommits = mockGetParsedCommits;
  });
  return { CommitsParser };
});

const mockValidateCommits = vi.fn(() => VALIDATED_COMMITS);
vi.mock('./validate-commits/CommitsValidator.js', () => {
  const CommitsValidator = vi.fn(class {
    validateCommits = mockValidateCommits;
  });
  return { CommitsValidator };
});

const mockValidateCommitsWithScope = vi.fn(() => VALIDATED_COMMITS);
vi.mock('./validate-commits/CommitsValidatorWithScope.js', () => {
  const CommitsValidatorWithScope = vi.fn(class {
    validateCommits = mockValidateCommitsWithScope;
  });
  return { CommitsValidatorWithScope };
});

const mockValidateCommitsWithType = vi.fn(() => VALIDATED_COMMITS);
vi.mock('./validate-commits/CommitsValidatorWithType.js', () => {
  const CommitsValidatorWithType = vi.fn(class {
    validateCommits = mockValidateCommitsWithType;
  });
  return { CommitsValidatorWithType };
});

const mockValidateCommitsWithScopeAndType = vi.fn(() => VALIDATED_COMMITS);
vi.mock('./validate-commits/CommitsValidatorWithScopeAndType.js', () => {
  const CommitsValidatorWithScopeAndType = vi.fn(class {
    validateCommits = mockValidateCommitsWithScopeAndType;
  });
  return { CommitsValidatorWithScopeAndType };
});

const ALLOWED_SCOPES = ['ui', 'api'] as const;
const ALLOWED_TYPES = ['feat', 'fix'] as const;

describe('retrieveValidatedCommits', () => {
  const onError = vi.fn();

  describe('retrieve commits', () => {
    it('should retrieve raw commits with commitsRetrieverOptions', () => {
      const commitsRetrieverOptions = { from: 'abc123' };
      const _ = [...retrieveValidatedCommits({ commitsRetrieverOptions })];

      expect(CommitsRetriever).toHaveBeenCalledWith(commitsRetrieverOptions);
      expect(mockGetRawCommits).toHaveBeenCalled();
    });

    it('should parse raw commits with commitsParserOptions', () => {
      const commitsParserOptions = { fieldPattern: /somepattern/ };
      const _ = [...retrieveValidatedCommits({ commitsParserOptions })];

      expect(CommitsParser).toHaveBeenCalledWith(commitsParserOptions);
      expect(mockGetParsedCommits).toHaveBeenCalledWith(RAW_COMMITS);
    });
  });

  describe('validate commits', () => {
    it('should validate commits with allowed scopes only', () => {
      const result = [...retrieveValidatedCommits({
        commitsValidatorOptions: { allowedCommitScopes: ALLOWED_SCOPES },
        onError,
      })];

      expect(CommitsValidatorWithScope).toHaveBeenCalledWith({
        allowedCommitScopes: ALLOWED_SCOPES,
        onError,
      });
      expect(mockValidateCommitsWithScope).toHaveBeenCalledWith(PARSED_COMMITS);
      expect(result).toEqual(VALIDATED_COMMITS);

      expect(CommitsValidator).not.toHaveBeenCalled();
      expect(CommitsValidatorWithType).not.toHaveBeenCalled();
      expect(CommitsValidatorWithScopeAndType).not.toHaveBeenCalled();
    });

    it('should validate commits with allowed types only', () => {
      const result = [...retrieveValidatedCommits({
        commitsValidatorOptions: { allowedCommitTypes: ALLOWED_TYPES },
        onError,
      })];

      expect(CommitsValidatorWithType).toHaveBeenCalledWith({
        allowedCommitTypes: ALLOWED_TYPES,
        onError,
      });
      expect(mockValidateCommitsWithType).toHaveBeenCalledWith(PARSED_COMMITS);
      expect(result).toEqual(VALIDATED_COMMITS);

      expect(CommitsValidator).not.toHaveBeenCalled();
      expect(CommitsValidatorWithScope).not.toHaveBeenCalled();
      expect(CommitsValidatorWithScopeAndType).not.toHaveBeenCalled();
    });

    it('should validate commits with allowed scopes and types', () => {
      const result = [...retrieveValidatedCommits({
        commitsValidatorOptions: {
          allowedCommitScopes: ALLOWED_SCOPES,
          allowedCommitTypes: ALLOWED_TYPES,
        },
        onError,
      })];

      expect(CommitsValidatorWithScopeAndType).toHaveBeenCalledWith({
        allowedCommitScopes: ALLOWED_SCOPES,
        allowedCommitTypes: ALLOWED_TYPES,
        onError,
      });
      expect(mockValidateCommitsWithScopeAndType).toHaveBeenCalledWith(PARSED_COMMITS);
      expect(result).toEqual(VALIDATED_COMMITS);

      expect(CommitsValidator).not.toHaveBeenCalled();
      expect(CommitsValidatorWithScope).not.toHaveBeenCalled();
      expect(CommitsValidatorWithType).not.toHaveBeenCalled();
    });

    it('should validate commits without scopes and types if not provided', () => {
      const result = [...retrieveValidatedCommits({ onError })];

      expect(CommitsValidator).toHaveBeenCalledWith({ onError });
      expect(mockValidateCommits).toHaveBeenCalledWith(PARSED_COMMITS);
      expect(result).toEqual(VALIDATED_COMMITS);

      expect(CommitsValidatorWithScope).not.toHaveBeenCalled();
      expect(CommitsValidatorWithType).not.toHaveBeenCalled();
      expect(CommitsValidatorWithScopeAndType).not.toHaveBeenCalled();
    });
  });
});
