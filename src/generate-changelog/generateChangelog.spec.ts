import { logError } from '../utils/error/logError.js';

import { generateChangelog } from './generateChangelog.js';
import type { TagEntry } from './generateChangelog.js';
import { generateChangelogVersioned } from './utils/generateChangelogVersioned.js';
import { getVersionTags } from './utils/getVersionTags.js';
import { getTagDate } from './utils/git/getTagDate.js';
import { handleGenerateChangelogErrors } from './utils/handleGenerateChangelogErrors.js';

vi.mock('../utils/error/logError.js', () => ({
  logError: vi.fn(),
}));
vi.mock('./utils/generateChangelogVersioned.js', () => ({
  generateChangelogVersioned: vi.fn(() => VERSIONED_RESULTS),
}));
vi.mock('./utils/git/getTagDate.js', () => ({
  getTagDate: vi.fn((tag: string, _) => `date-${tag}`),
}));
vi.mock('./utils/getVersionTags.js', () => ({
  getVersionTags: vi.fn(() => TAGS),
}));
vi.mock('./utils/handleGenerateChangelogErrors.js', () => ({
  handleGenerateChangelogErrors: vi.fn(),
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
    expect(handleGenerateChangelogErrors).not.toHaveBeenCalled();
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
      expect(handleGenerateChangelogErrors).toHaveBeenCalledExactlyOnceWith(
        VERSIONED_RESULTS,
        onError,
      );
    },
  );

  it('should not generate changelog entries when the user performs a dry run', async () => {
    await generateChangelog({
      directoryPath: DIRECTORY_PATH,
      isDryRun: true,
    });

    expect(generateChangelogVersioned).not.toHaveBeenCalled();
    expect(handleGenerateChangelogErrors).not.toHaveBeenCalled();
  });

  it(
    'should use the default error handler when the user does not provide an error handler',
    async () => {
      await generateChangelog({ directoryPath: DIRECTORY_PATH });

      expect(generateChangelogVersioned).toHaveBeenCalledExactlyOnceWith(
        TAG_ENTRIES,
        expect.objectContaining({ onError: logError }),
      );
      expect(handleGenerateChangelogErrors).toHaveBeenCalledExactlyOnceWith(
        VERSIONED_RESULTS,
        logError,
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
    expect(handleGenerateChangelogErrors).not.toHaveBeenCalled();
  });
});
