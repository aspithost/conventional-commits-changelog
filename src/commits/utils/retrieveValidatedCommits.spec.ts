import { CommitsParser } from '../parse-commits/CommitsParser.js';
import { CommitsRetriever } from '../retrieve-commits/CommitsRetriever.js';
import { TagRetriever } from '../retrieve-tags/TagRetriever.js';
import { CommitsValidator } from '../validate-commits/CommitsValidator.js';

import { retrieveValidatedCommits } from './retrieveValidatedCommits.js';

const PARSED_COMMITS = ['parsed-commit-one', 'parsed-commit-two'];
const mockGetParsedCommits = vi.fn(() => PARSED_COMMITS);
vi.mock('../parse-commits/CommitsParser.js', () => {
  const CommitsParser = vi.fn(class {
    getParsedCommits = mockGetParsedCommits;
  });
  return { CommitsParser };
});

const RAW_COMMITS = ['raw-commit-one', 'raw-commit-two'];
const mockGetRawCommits = vi.fn(() => RAW_COMMITS);
vi.mock('../retrieve-commits/CommitsRetriever.js', () => {
  const CommitsRetriever = vi.fn(class {
    getRawCommits = mockGetRawCommits;
  });
  return { CommitsRetriever };
});

const VALIDATED_COMMITS = ['validated-commit-one', 'validated-commit-two'];
const mockGetValidatedCommits = vi.fn(() => VALIDATED_COMMITS);
vi.mock('../validate-commits/CommitsValidator.js', () => {
  const CommitsValidator = vi.fn(class {
    getValidatedCommits = mockGetValidatedCommits;
  });
  return { CommitsValidator };
});

const LATEST_TAG = 'latest-tag';
const mockGetLatestTag = vi.fn(() => LATEST_TAG);
vi.mock('../retrieve-tags/TagRetriever.js', () => {
  const TagRetriever = vi.fn(class {
    getLatestTag = mockGetLatestTag;
  });
  return { TagRetriever };
});

describe('retrieveValidatedCommits', () => {
  describe('TagRetriever', () => {
    it('should retrieve the latest tag', () => {
      const TAG_RETRIEVER_OPTIONS = {
        remoteSymbolicRef: 'some/remote',
      };

      retrieveValidatedCommits({ tagRetrieverOptions: TAG_RETRIEVER_OPTIONS });

      expect(TagRetriever).toHaveBeenCalledExactlyOnceWith(TAG_RETRIEVER_OPTIONS);
      expect(mockGetLatestTag).toHaveBeenCalledOnce();
    });

    it('should use the tag passed in by the user', () => {
      const FROM = 'some-tag';
      retrieveValidatedCommits({
        commitsRetrieverOptions: { from: FROM },
      });

      expect(mockGetLatestTag).not.toHaveBeenCalled();
      expect(CommitsRetriever)
        .toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ from: FROM }));
    });
  });

  it('should retrieve raw commits since the latest tag', () => {
    const COMMITS_RETRIEVER_OPTIONS = {
      commitFormat: 'some-format',
    };
    retrieveValidatedCommits({ commitsRetrieverOptions: COMMITS_RETRIEVER_OPTIONS });

    expect(TagRetriever).toHaveBeenCalledOnce();
    expect(mockGetParsedCommits).toHaveBeenCalledOnce();
    expect(CommitsRetriever).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      ...COMMITS_RETRIEVER_OPTIONS,
      from: LATEST_TAG,
    }));
    expect(mockGetRawCommits).toHaveBeenCalledOnce();
  });

  it('should parse the raw commits', () => {
    const COMMITS_PARSER_OPTIONS = {
      parserStreamOptions: {},
    };

    retrieveValidatedCommits({ commitsParserOptions: COMMITS_PARSER_OPTIONS });

    expect(CommitsParser).toHaveBeenCalledExactlyOnceWith(COMMITS_PARSER_OPTIONS);
    expect(mockGetParsedCommits).toHaveBeenCalledExactlyOnceWith(RAW_COMMITS);
  });

  it('should validate and return the parsed commits', () => {
    const onError = vi.fn();

    const validatedCommits = retrieveValidatedCommits({
      onError,
    });

    expect(CommitsValidator).toHaveBeenCalledExactlyOnceWith({ onError });
    expect(mockGetValidatedCommits).toHaveBeenCalledExactlyOnceWith(PARSED_COMMITS);
    expect(validatedCommits).toBe(VALIDATED_COMMITS);
  });
});
