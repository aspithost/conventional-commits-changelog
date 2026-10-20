import { retrieveValidatedCommits } from '../../../commits/retrieveValidatedCommits.js';
import { createChangelogWriter } from '../../../write-changelog/utils/createChangelogWriter.js';
import type { TagEntry } from '../tags/formatTagEntries.js';
import {
  getReleaseTypeBetweenTags,
} from '../tags/get-release-type-between-tags/getReleaseTypeBetweenTags.js';
import {
  parseSemverVersionFromTag,
} from '../tags/parse-semver-version-from-tag/parseSemverVersionFromTag.js';

import { generateChangelogVersioned } from './generateChangelogVersioned.js';

import type { CommitsRetrieverOptions } from '@/commits/retrieve-commits/CommitsRetriever.js';

const COMMITS = vi.hoisted(() => [
  { commit: 'one' },
  { commit: 'two' },
]);
vi.mock('../../../commits/retrieveValidatedCommits.js', () => ({
  retrieveValidatedCommits: vi.fn(() => COMMITS),
}));

const mockWriteChangelog = vi.fn();
vi.mock('../../../write-changelog/utils/createChangelogWriter.js', () => ({
  createChangelogWriter: vi.fn(() => ({
    writeChangelog: mockWriteChangelog,
  })),
}));

vi.mock('../tags/get-release-type-between-tags/getReleaseTypeBetweenTags.js', () => ({
  getReleaseTypeBetweenTags: vi.fn(() => 'minor'),
}));
vi.mock('../tags/parse-semver-version-from-tag/parseSemverVersionFromTag.js', () => ({
  parseSemverVersionFromTag: vi.fn((tag: string) => tag.replace(/^v/, '')),
}));

describe('generateChangelogVersioned', () => {
  const DIRECTORY_PATH = 'some-path';
  const TAG_ENTRY_ONE: TagEntry = {
    date: '2024-06-07',
    tagPrevious: 'v0.1.0',
    tagCurrent: 'v0.1.1',
  };
  const TAG_ENTRY_TWO: TagEntry = {
    date: '2024-06-06',
    tagCurrent: 'v0.1.0',
  };
  const onError = vi.fn();

  describe('happy flow', () => {
    beforeEach( async () => {
      await generateChangelogVersioned([TAG_ENTRY_ONE, TAG_ENTRY_TWO], {
        directoryPath: DIRECTORY_PATH,
        onError,
      });
    });

    it('should initialize the changelog writer', () => {
      expect(createChangelogWriter).toHaveBeenCalledTimes(1);
    });

    it('should parse the semver version from each tag', () => {
      expect(parseSemverVersionFromTag).toHaveBeenCalledTimes(3);
      expect(parseSemverVersionFromTag).toHaveBeenNthCalledWith(1, TAG_ENTRY_ONE.tagCurrent);
      expect(parseSemverVersionFromTag).toHaveBeenNthCalledWith(2, TAG_ENTRY_ONE.tagPrevious);
      expect(parseSemverVersionFromTag).toHaveBeenNthCalledWith(3, TAG_ENTRY_TWO.tagCurrent);
    });

    it('should determine the release type from the parsed versions', () => {
      expect(getReleaseTypeBetweenTags).toHaveBeenCalledTimes(2);
      expect(getReleaseTypeBetweenTags).toHaveBeenNthCalledWith(1, '0.1.1', '0.1.0');
      expect(getReleaseTypeBetweenTags).toHaveBeenNthCalledWith(2, '0.1.0', undefined);
    });

    it('should retrieve commits between the raw tags of each version', () => {
      expect(retrieveValidatedCommits).toHaveBeenCalledTimes(2);
      expect(retrieveValidatedCommits).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          commitsRetrieverOptions: expect.objectContaining({
            cwd: DIRECTORY_PATH,
            from: TAG_ENTRY_ONE.tagPrevious,
            to: TAG_ENTRY_ONE.tagCurrent,
            onError,
          }) as CommitsRetrieverOptions,
        }),
      );
      expect(retrieveValidatedCommits).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          commitsRetrieverOptions: expect.objectContaining({
            cwd: DIRECTORY_PATH,
            from: null,
            to: TAG_ENTRY_TWO.tagCurrent,
            onError,
          }) as CommitsRetrieverOptions,
        }),
      );
    });

    it('should write changelog entries with the parsed version for each tag', () => {
      expect(mockWriteChangelog).toHaveBeenCalledTimes(2);
      expect(mockWriteChangelog).toHaveBeenNthCalledWith(
        1,
        DIRECTORY_PATH,
        '0.1.1',
        'minor',
        COMMITS,
        { date: TAG_ENTRY_ONE.date },
      );
      expect(mockWriteChangelog).toHaveBeenNthCalledWith(
        2,
        DIRECTORY_PATH,
        '0.1.0',
        'minor',
        COMMITS,
        { date: TAG_ENTRY_TWO.date },
      );
    });
  });

  describe('options', () => {
    it('should forward the parser, retriever, and validator options', async () => {
      const commitsParserOptions = { parserStreamOptions: { headerPattern: /^(.*)$/ } };
      const commitsRetrieverOptions = { remoteSymbolicRef: 'refs/remotes/upstream/HEAD' };
      const commitsValidatorOptions = { allowedCommitScopes: new Set(['core']) };

      await generateChangelogVersioned([TAG_ENTRY_ONE], {
        commitsParserOptions,
        commitsRetrieverOptions,
        commitsValidatorOptions,
        directoryPath: DIRECTORY_PATH,
        onError,
      });

      expect(retrieveValidatedCommits).toHaveBeenCalledExactlyOnceWith({
        commitsParserOptions,
        commitsRetrieverOptions: {
          ...commitsRetrieverOptions,
          cwd: DIRECTORY_PATH,
          from: TAG_ENTRY_ONE.tagPrevious,
          to: TAG_ENTRY_ONE.tagCurrent,
          onError,
        },
        commitsValidatorOptions,
        onError,
      });
    });
  });

  describe('unhappy flow', () => {
    it('should log an error for each changelog entry that fails', async () => {
      const FIRST_ERROR = new Error('First error');
      const SECOND_ERROR = new Error('Second error');
      mockWriteChangelog.mockRejectedValueOnce(FIRST_ERROR).mockRejectedValueOnce(SECOND_ERROR);

      await generateChangelogVersioned([TAG_ENTRY_ONE, TAG_ENTRY_TWO], {
        directoryPath: DIRECTORY_PATH,
        onError,
      });

      expect(onError).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining(TAG_ENTRY_ONE.tagCurrent),
        { cause: FIRST_ERROR },
      );
      expect(onError).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(TAG_ENTRY_TWO.tagCurrent),
        { cause: SECOND_ERROR },
      );
    });

    it('should write later entries after an earlier entry fails', async () => {
      mockWriteChangelog.mockRejectedValueOnce(new Error('First error'));

      await generateChangelogVersioned([TAG_ENTRY_ONE, TAG_ENTRY_TWO], {
        directoryPath: DIRECTORY_PATH,
        onError,
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(mockWriteChangelog).toHaveBeenCalledTimes(2);
    });
  });
});
