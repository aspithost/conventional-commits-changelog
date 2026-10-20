import { generateChangelog } from './generateChangelog.js';
import type { TagEntry } from './generateChangelog.js';
import {
  generateChangelogVersioned,
} from './utils/generate-changelog-versioned/generateChangelogVersioned.js';
import { getTagDate } from './utils/get-tag-date/getTagDate.js';
import { getVersionTags } from './utils/get-version-tags/getVersionTags.js';

vi.mock('./utils/generate-changelog-versioned/generateChangelogVersioned.js', () => ({
  generateChangelogVersioned: vi.fn(() => VERSIONED_RESULTS),
}));
vi.mock('./utils/get-tag-date/getTagDate.js', () => ({
  getTagDate: vi.fn((tag: string, _) => `date-${tag}`),
}));
vi.mock('./utils/get-version-tags/getVersionTags.js', () => ({
  getVersionTags: vi.fn(() => TAGS),
}));

const DIRECTORY_PATH = '/repo';
const TAGS = vi.hoisted(() => [
  'v1.0.0',
  'v0.1.0',
  'v0.0.1',
]);
const TAG_ENTRIES: TagEntry[] = [
  {
    targetVersion: 'v1.0.0',
    previousVersion: 'v0.1.0',
    date: 'date-v1.0.0',
  },
  {
    previousVersion: 'v0.0.1',
    targetVersion: 'v0.1.0',
    date: 'date-v0.1.0',
  },
  {
    targetVersion: 'v0.0.1',
    date: 'date-v0.0.1',
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

      expect(vi.mocked(getTagDate)).toHaveBeenNthCalledWith(
        1,
        TAG_ENTRIES[0].targetVersion,
        DIRECTORY_PATH,
      );
      expect(vi.mocked(getTagDate)).toHaveBeenNthCalledWith(
        2,
        TAG_ENTRIES[1].targetVersion,
        DIRECTORY_PATH,
      );
      expect(vi.mocked(getTagDate)).toHaveBeenNthCalledWith(
        3,
        TAG_ENTRIES[2].targetVersion,
        DIRECTORY_PATH,
      );
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
    },
  );

  it('should not generate changelog entries when the user performs a dry run', async () => {
    console.log = vi.fn();
    await generateChangelog({
      directoryPath: DIRECTORY_PATH,
      isDryRun: true,
    });

    expect(generateChangelogVersioned).not.toHaveBeenCalled();
  });
});
