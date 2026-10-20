import { retrieveValidatedCommits } from '../../../commits/retrieveValidatedCommits.js';
import { createChangelogWriter } from '../../../write-changelog/utils/createChangelogWriter.js';
import {
  getReleaseTypeBetweenTags, parseSemverVersion,
} from '../version/version.js';

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

vi.mock('../version/version.js', () => ({
  getReleaseTypeBetweenTags: vi.fn(),
  parseSemverVersion: vi.fn(),
}));

describe('generateChangelogVersioned', () => {
  const DIRECTORY_PATH = 'some-path';
  const TAG_ENTRY_ONE = {
    date: '2024-06-07',
    previousVersion: 'v0.1.0',
    targetVersion: 'v0.1.1',
  };
  const TAG_ENTRY_TWO = {
    date: '2024-06-06',
    targetVersion: 'v0.1.0',
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

    it('should retrieve commits for each version', () => {
      expect(retrieveValidatedCommits).toHaveBeenCalledTimes(2);
      expect(retrieveValidatedCommits).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          commitsRetrieverOptions: expect.objectContaining({
            cwd: DIRECTORY_PATH,
            from: TAG_ENTRY_ONE.previousVersion,
            to: TAG_ENTRY_ONE.targetVersion,
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
            to: TAG_ENTRY_TWO.targetVersion,
            onError,
          }) as CommitsRetrieverOptions,
        }),
      );
    });

    it('should write changelog entries for each version', () => {
      expect(mockWriteChangelog).toHaveBeenCalledTimes(2);
      expect(mockWriteChangelog).toHaveBeenNthCalledWith(
        1,
        DIRECTORY_PATH,
        parseSemverVersion(TAG_ENTRY_ONE.targetVersion),
        getReleaseTypeBetweenTags(TAG_ENTRY_ONE.targetVersion, TAG_ENTRY_ONE.previousVersion),
        COMMITS,
        { date: TAG_ENTRY_ONE.date },
      );
      expect(mockWriteChangelog).toHaveBeenNthCalledWith(
        2,
        DIRECTORY_PATH,
        parseSemverVersion(TAG_ENTRY_TWO.targetVersion),
        getReleaseTypeBetweenTags(TAG_ENTRY_TWO.targetVersion),
        COMMITS,
        { date: TAG_ENTRY_TWO.date },
      );
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
        expect.stringContaining(TAG_ENTRY_ONE.targetVersion),
        { cause: FIRST_ERROR },
      );
      expect(onError).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining(TAG_ENTRY_TWO.targetVersion),
        { cause: SECOND_ERROR },
      );
    });
  });
});
