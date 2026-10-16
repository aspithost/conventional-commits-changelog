import { logError } from '../utils/error/logError.js';

import { generateChangelog } from './generateChangelog.js';
import type { TagEntry } from './generateChangelog.js';
import {
  generateChangelogVersioned,
} from './utils/generate-changelog-versioned/generateChangelogVersioned.js';
import { getTagDate } from './utils/get-tag-date/getTagDate.js';
import { getVersionTags } from './utils/get-version-tags/getVersionTags.js';

import { logRejectedPromises } from '@/utils/log-rejected-promises/logRejectedPromises.js';

vi.mock('../utils/error/logError.js', () => ({
  logError: vi.fn(),
}));
vi.mock('./utils/generate-changelog-versioned/generateChangelogVersioned.js', () => ({
  generateChangelogVersioned: vi.fn(() => VERSIONED_RESULTS),
}));
vi.mock('./utils/get-tag-date/getTagDate.js', () => ({
  getTagDate: vi.fn((tag: string, _) => `date-${tag}`),
}));
vi.mock('./utils/get-version-tags/getVersionTags.js', () => ({
  getVersionTags: vi.fn(() => TAGS),
}));
vi.mock('../utils/log-rejected-promises/logRejectedPromises.js', () => ({
  logRejectedPromises: vi.fn(),
}));

const DIRECTORY_PATH = '/repo';
const TAGS = vi.hoisted(() => [
  'v2.0.0',
  'v1.1.0',
  'v1.0.0',
]);
const TAG_ENTRIES: TagEntry[] = [
  {
    tag: 'v2.0.0',
    date: 'date-v2.0.0',
  },
  {
    tag: 'v1.1.0',
    previousTag: 'v2.0.0',
    date: 'date-v1.1.0',
  },
  {
    tag: 'v1.0.0',
    previousTag: 'v1.1.0',
    date: 'date-v1.0.0',
  },
];
const VERSIONED_RESULTS: PromiseSettledResult<void>[] = vi.hoisted(() => [
  {
    status: 'fulfilled',
    value: undefined,
  },
  {
    status: 'fulfilled',
    value: undefined,
  },
  {
    status: 'fulfilled',
    value: undefined,
  },
]);

describe('generateChangelog', () => {
  it('should find tags on the default remote branch and throw when none exist', async () => {
    vi.mocked(getVersionTags).mockReturnValueOnce([]);

    await expect(generateChangelog({ directoryPath: DIRECTORY_PATH }))
      .rejects.toThrow('Did not find valid semantic version tags.');

    expect(getVersionTags).toHaveBeenCalledExactlyOnceWith({
      cwd: DIRECTORY_PATH,
      remoteSymbolicRef: 'refs/remotes/origin/HEAD',
    });
    expect(getTagDate).not.toHaveBeenCalled();
    expect(generateChangelogVersioned).not.toHaveBeenCalled();
    expect(logRejectedPromises).not.toHaveBeenCalled();
  });

  it(
    'should generate a changelog entry for each tag that has a valid semver version',
    async () => {
      const changelogWriterOptions = {};
      const commitsParserOptions = {};
      const commitsRetrieverOptions = { remoteSymbolicRef: 'refs/remotes/upstream/HEAD' };
      const commitsValidatorOptions = {};
      const onError = vi.fn();

      await generateChangelog({
        changelogWriterOptions,
        commitsParserOptions,
        commitsRetrieverOptions,
        commitsValidatorOptions,
        directoryPath: DIRECTORY_PATH,
        onError,
      });

      expect(vi.mocked(getTagDate)).toHaveBeenNthCalledWith(1, 'v2.0.0', DIRECTORY_PATH);
      expect(vi.mocked(getTagDate)).toHaveBeenNthCalledWith(2, 'v1.1.0', DIRECTORY_PATH);
      expect(vi.mocked(getTagDate)).toHaveBeenNthCalledWith(3, 'v1.0.0', DIRECTORY_PATH);
      expect(generateChangelogVersioned).toHaveBeenCalledExactlyOnceWith(
        TAG_ENTRIES,
        {
          changelogWriterOptions,
          commitsParserOptions,
          commitsRetrieverOptions,
          commitsValidatorOptions,
          directoryPath: DIRECTORY_PATH,
          onError,
        },
      );
      expect(logRejectedPromises).toHaveBeenCalledExactlyOnceWith(
        VERSIONED_RESULTS,
        onError,
        'A changelog generation failed.',
      );
    },
  );

  it('should not generate changelog entries when the user performs a dry run', async () => {
    await generateChangelog({
      directoryPath: DIRECTORY_PATH,
      isDryRun: true,
    });

    expect(generateChangelogVersioned).not.toHaveBeenCalled();
    expect(logRejectedPromises).not.toHaveBeenCalled();
  });

  it(
    'should use the default error handler when the user does not provide an error handler',
    async () => {
      await generateChangelog({ directoryPath: DIRECTORY_PATH });

      expect(generateChangelogVersioned).toHaveBeenCalledExactlyOnceWith(
        TAG_ENTRIES,
        expect.objectContaining({ onError: logError }),
      );
      expect(logRejectedPromises).toHaveBeenCalledExactlyOnceWith(
        VERSIONED_RESULTS,
        logError,
        'A changelog generation failed.',
      );
    },
  );

  it('should skip error handling when the user opts out', async () => {
    await generateChangelog({
      directoryPath: DIRECTORY_PATH,
      onError: null,
    });

    expect(generateChangelogVersioned).toHaveBeenCalledExactlyOnceWith(
      TAG_ENTRIES,
      expect.objectContaining({ onError: null }),
    );
    expect(logRejectedPromises).not.toHaveBeenCalled();
  });
});
