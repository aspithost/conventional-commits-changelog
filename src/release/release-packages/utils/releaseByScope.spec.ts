import type { CommitsByScopeMap } from '../../../commits/group-commits/CommitsGrouper.js';
import type { DirectoryPathByScopeMap } from '../../../read-directories/types/directoriesReader.js';
import { bumpVersion } from '../../../version/bumpVersion.js';
import type { ChangelogWriterOptions } from '../../../write-changelog/ChangelogWriter.js';
import { createChangelogWriter } from '../../../write-changelog/utils/createChangelogWriter.js';
import { determineReleaseType } from '../../utils/determineReleaseType.js';

import { releaseByScope } from './releaseByScope.js';

const MOCK_NEW_VERSION = vi.hoisted(() => '3.6.9');
vi.mock('../../../version/bumpVersion.js', () => ({
  bumpVersion: vi.fn(() => MOCK_NEW_VERSION),
}));

const mockWriteChangelog = vi.fn();
vi.mock('../../../write-changelog/utils/createChangelogWriter.js', () => ({
  createChangelogWriter: vi.fn(() => ({
    writeChangelog: mockWriteChangelog,
  })),
}));

const MOCK_RELEASE_TYPE = vi.hoisted(() => 'minor');
vi.mock('../../utils/determineReleaseType.js', () => ({
  determineReleaseType: vi.fn(() => MOCK_RELEASE_TYPE),
}));

const PATH_TO_BUTTON = '/path/to/button';
const PATH_TO_CARD = '/path/to/card';
const BUTTON_SCOPE = 'button';
const CARD_SCOPE = 'card';
const DIRECTORY_PATH_BY_SCOPE_MAP = new Map([
  [BUTTON_SCOPE, { directoryPath: PATH_TO_BUTTON }],
  [CARD_SCOPE, { directoryPath: PATH_TO_CARD }],
  // Note: does not include root scope entry. Used to test edge case
]) as unknown as DirectoryPathByScopeMap<string>;

const COMMITS_BY_SCOPE_MAP = new Map([
  [
    BUTTON_SCOPE,
    [
      {
        scope: BUTTON_SCOPE,
        message: 'feat: add button',
      },
    ],
  ],
  [
    CARD_SCOPE,
    [
      {
        scope: CARD_SCOPE,
        message: 'feat: add card',
      },
    ],
  ],
  [
    'root',
    [
      {
        scope: 'root',
        message: 'feat: add something',
      },
    ],
  ],
]) as unknown as CommitsByScopeMap<string>;

const onError = vi.fn();
const OPTIONS = {
  changelogWriterOptions: { someKey: 'someValue' } as unknown as Partial<ChangelogWriterOptions>,
  isUpdateReadme: true,
  onError,
};

describe('releaseByScope', () => {
  it('should initialize the changelog writer', async () => {
    await releaseByScope(
      DIRECTORY_PATH_BY_SCOPE_MAP,
      COMMITS_BY_SCOPE_MAP,
      OPTIONS,
    );

    expect(createChangelogWriter).toHaveBeenCalledExactlyOnceWith(OPTIONS.changelogWriterOptions);
  });

  describe('determine release type', () => {
    it('should determine the release type of each scope based on its commits', async () => {
      await releaseByScope(
        DIRECTORY_PATH_BY_SCOPE_MAP,
        COMMITS_BY_SCOPE_MAP,
        OPTIONS,
      );

      expect(vi.mocked(determineReleaseType)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(determineReleaseType))
        .toHaveBeenNthCalledWith(1, COMMITS_BY_SCOPE_MAP.get(BUTTON_SCOPE));
      expect(vi.mocked(determineReleaseType))
        .toHaveBeenNthCalledWith(2, COMMITS_BY_SCOPE_MAP.get(CARD_SCOPE));
    });

    it(
      'should not bump the version for a scope when its commits do not warrant a release',
      async () => {
        vi.mocked(determineReleaseType).mockReturnValueOnce(null);

        await releaseByScope(
          DIRECTORY_PATH_BY_SCOPE_MAP,
          COMMITS_BY_SCOPE_MAP,
          OPTIONS,
        );

        expect(vi.mocked(bumpVersion)).toHaveBeenCalledExactlyOnceWith(
          DIRECTORY_PATH_BY_SCOPE_MAP.get(CARD_SCOPE)?.directoryPath,
          expect.any(String),
          expect.any(Object),
        );
      },
    );
  });

  it('should bump the version for each scope', async () => {
    const { isUpdateReadme, onError } = OPTIONS;
    const PATCH = 'patch';
    vi.mocked(determineReleaseType).mockReturnValueOnce(PATCH);

    await releaseByScope(
      DIRECTORY_PATH_BY_SCOPE_MAP,
      COMMITS_BY_SCOPE_MAP,
      OPTIONS,
    );

    expect(vi.mocked(bumpVersion)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(bumpVersion))
      .toHaveBeenNthCalledWith(
        1,
        DIRECTORY_PATH_BY_SCOPE_MAP.get(BUTTON_SCOPE)?.directoryPath,
        PATCH,
        {
          isUpdateReadme,
          onError,
        },
      );
    expect(vi.mocked(bumpVersion))
      .toHaveBeenNthCalledWith(
        2,
        DIRECTORY_PATH_BY_SCOPE_MAP.get(CARD_SCOPE)?.directoryPath,
        MOCK_RELEASE_TYPE,
        {
          isUpdateReadme,
          onError,
        },
      );
  });

  it('should write changelog entries for each scope', async () => {
    await releaseByScope(
      DIRECTORY_PATH_BY_SCOPE_MAP,
      COMMITS_BY_SCOPE_MAP,
      OPTIONS,
    );

    expect(mockWriteChangelog).toHaveBeenCalledTimes(2);
    expect(mockWriteChangelog)
      .toHaveBeenNthCalledWith(
        1,
        DIRECTORY_PATH_BY_SCOPE_MAP.get(BUTTON_SCOPE)?.directoryPath,
        expect.any(String),
        expect.any(String),
        COMMITS_BY_SCOPE_MAP.get(BUTTON_SCOPE),
      );
    expect(mockWriteChangelog)
      .toHaveBeenNthCalledWith(
        2,
        DIRECTORY_PATH_BY_SCOPE_MAP.get(CARD_SCOPE)?.directoryPath,
        expect.any(String),
        expect.any(String),
        COMMITS_BY_SCOPE_MAP.get(CARD_SCOPE),
      );
  });
});
