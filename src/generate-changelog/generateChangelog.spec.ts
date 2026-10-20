import { generateChangelog } from './generateChangelog.js';
import {
  generateChangelogVersioned,
} from './utils/generate-changelog-versioned/generateChangelogVersioned.js';
import { type TagEntry, formatTagEntries } from './utils/tags/formatTagEntries.js';
import { getVersionTags } from './utils/tags/getVersionTags.js';

const TAGS = vi.hoisted(() => [
  'v0.0.1',
  'v0.1.0',
  'v1.0.0',
]);
const FORMATTED_TAG_ENTRIES: TagEntry[] = vi.hoisted(() => [
  {
    tagCurrent: 'v0.0.1',
    tagPrevious: undefined,
    date: 'date-v0.0.1',
  },
  {
    tagCurrent: 'v0.1.0',
    tagPrevious: 'v0.0.1',
    date: 'date-v0.1.0',
  },
  {
    tagCurrent: 'v1.0.0',
    tagPrevious: 'v0.1.0',
    date: 'date-v1.0.0',
  },
]);

vi.mock('./utils/generate-changelog-versioned/generateChangelogVersioned.js', () => ({
  generateChangelogVersioned: vi.fn(),
}));
vi.mock('./utils/tags/formatTagEntries.js', () => ({
  formatTagEntries: vi.fn(() => FORMATTED_TAG_ENTRIES),
}));
vi.mock('./utils/tags/getVersionTags.js', () => ({
  getVersionTags: vi.fn(() => TAGS),
}));

const DIRECTORY_PATH = '/repo';

describe('generateChangelog', () => {
  it('should find tags on the default remote branch and throw when none exist', async () => {
    vi.mocked(getVersionTags).mockReturnValueOnce([]);

    await expect(generateChangelog({ directoryPath: DIRECTORY_PATH }))
      .rejects.toThrow('Did not find valid semantic version tags.');

    expect(getVersionTags).toHaveBeenCalledExactlyOnceWith({
      cwd: DIRECTORY_PATH,
      remoteSymbolicRef: 'refs/remotes/origin/HEAD',
    });
    expect(generateChangelogVersioned).not.toHaveBeenCalled();
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

      expect(getVersionTags).toHaveBeenCalledExactlyOnceWith({
        cwd: DIRECTORY_PATH,
        remoteSymbolicRef: 'refs/remotes/upstream/HEAD',
      });
      expect(formatTagEntries).toHaveBeenCalledExactlyOnceWith(DIRECTORY_PATH, TAGS);
      expect(generateChangelogVersioned).toHaveBeenCalledExactlyOnceWith(
        FORMATTED_TAG_ENTRIES,
        {
          changelogWriterOptions,
          commitsParserOptions,
          commitsRetrieverOptions,
          commitsValidatorOptions,
          directoryPath: DIRECTORY_PATH,
          onError,
        },
      );
    },
  );

  it('should log the parsed version and date for each dry-run tag', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await generateChangelog({
      directoryPath: DIRECTORY_PATH,
      isDryRun: true,
    });

    expect(logSpy).toHaveBeenCalledTimes(FORMATTED_TAG_ENTRIES.length);
    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      '[dry-run] Would write changelog entry for tag 0.0.1 (date-v0.0.1).',
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      '[dry-run] Would write changelog entry for tag 0.1.0 (date-v0.1.0).',
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      3,
      '[dry-run] Would write changelog entry for tag 1.0.0 (date-v1.0.0).',
    );
    expect(generateChangelogVersioned).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});
