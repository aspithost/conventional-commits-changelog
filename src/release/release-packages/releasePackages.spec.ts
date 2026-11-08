import { retrieveValidatedCommits } from '../../commits/utils/retrieveValidatedCommits.js';
import type { ValidatedCommit } from '../../commits/validate-commits/CommitsValidator.js';
import { DirectoriesReader } from '../../read-directories/DirectoriesReader.js';
import { bumpVersion } from '../../version/bumpVersion.js';
import { determineReleaseType } from '../utils/determineReleaseType.js';

import { CommitsGrouper } from './group-commits/CommitsGrouper.js';
import { releasePackages } from './releasePackages.js';
import { logRejectedPromises } from './utils/logRejectedPromises.js';

const BUTTON_SCOPE = vi.hoisted(() => '@some-scope/button');
const CARD_SCOPE = vi.hoisted(() => '@some-other-scope/card');
const DRAWER_SCOPE = vi.hoisted(() => 'drawer');
const BUTTON_DIRECTORY_PATH = vi.hoisted(() => 'button-directory-path');
const CARD_DIRECTORY_PATH = vi.hoisted(() => 'card-directory-path');

const BUTTON_COMMITS = vi.hoisted(() => [
  {
    scope: BUTTON_SCOPE,
    type: 'feat',
  },
]);
const CARD_COMMITS = vi.hoisted(() => [
  {
    scope: CARD_SCOPE,
    type: 'fix',
  },
]);
const DRAWER_COMMITS = vi.hoisted(() => [
  {
    scope: DRAWER_SCOPE,
    type: 'chore',
  },
]);
const COMMIT_BY_SCOPE_MAP = vi.hoisted(() => new Map([
  [BUTTON_SCOPE, BUTTON_COMMITS],
  [CARD_SCOPE, CARD_COMMITS],
  [DRAWER_SCOPE, DRAWER_COMMITS],
]));
vi.mock('./group-commits/CommitsGrouper.js', () => {
  const CommitsGrouper = vi.fn(class {
    commitsByScopeMap = COMMIT_BY_SCOPE_MAP;
  });
  return { CommitsGrouper };
});

vi.mock('../../commits/utils/retrieveValidatedCommits.js', () => ({
  retrieveValidatedCommits: vi.fn(() => []),
}));

const PACKAGES_DIRECTORIES_MAP = vi.hoisted(() => new Map([
  [BUTTON_SCOPE, { directoryPath: BUTTON_DIRECTORY_PATH }],
  [CARD_SCOPE, { directoryPath: CARD_DIRECTORY_PATH }],
]));
vi.mock('../../read-directories/DirectoriesReader.js', () => {
  const DirectoriesReader = vi.fn(class {
    packagesDirectoriesMap = PACKAGES_DIRECTORIES_MAP;
  });
  return { DirectoriesReader };
});

const BUMPED_VERSION = vi.hoisted(() => 'v6.7.0');
vi.mock('../../version/bumpVersion.js', () => ({
  bumpVersion: vi.fn(() => BUMPED_VERSION),
}));

const mockWriteChangelog = vi.fn();
vi.mock('../../write-changelog/utils/createChangelogWriter.js', () => ({
  createChangelogWriter: () => ({
    writeChangelog: mockWriteChangelog,
  }),
}));

const RELEASE_TYPE = vi.hoisted(() => 'minor');
vi.mock('../utils/determineReleaseType.js', () => ({
  determineReleaseType: vi.fn(() => RELEASE_TYPE),
}));

vi.mock('./utils/logRejectedPromises.js', () => ({
  logRejectedPromises: vi.fn(),
}));

describe('releasePackages', () => {
  describe('reading directories', () => {
    it('should read the directories in the provided directory path', async () => {
      const DIRECTORY_PATH = 'packages';

      await releasePackages({
        directoriesReaderOptions: { directoryPath: DIRECTORY_PATH },
      });

      expect(DirectoriesReader).toHaveBeenCalledWith({
        directoryPath: DIRECTORY_PATH,
      });
    });

    it(
      'should throw an error if the user does not have any folders with a package.json file',
      async () => {
        // @ts-expect-error: Simplified mock of DirectoriesReader class
        vi.mocked(DirectoriesReader).mockImplementationOnce(class DirectoriesReader {
          packagesDirectoriesMap = new Map();
        });

        await expect(releasePackages())
          .rejects
          .toThrow(new Error(
            'No packages with a valid package.json found in the specified directory',
          ));
      },
    );
  });

  describe('retrieve validated commits', () => {
    it('should retrieve validated commits with the correct parameters', async () => {
      const COMMITS_PARSER_OPTIONS = {};
      const COMMITS_RETRIEVER_OPTIONS = {};
      const TAG_RETRIEVER_OPTIONS = {};
      const onError = vi.fn();

      await releasePackages({
        commitsParserOptions: COMMITS_PARSER_OPTIONS,
        commitsRetrieverOptions: COMMITS_RETRIEVER_OPTIONS,
        tagRetrieverOptions: TAG_RETRIEVER_OPTIONS,
        onError,
      });

      expect(retrieveValidatedCommits).toHaveBeenCalledExactlyOnceWith({
        commitsParserOptions: COMMITS_PARSER_OPTIONS,
        commitsRetrieverOptions: COMMITS_RETRIEVER_OPTIONS,
        tagRetrieverOptions: TAG_RETRIEVER_OPTIONS,
        onError,
      });
    });
  });

  it('should group the validated commits by scope', async () => {
    const VALIDATED_COMMITS_ITERATOR = [{ scope: 'button' } as ValidatedCommit];
    vi.mocked(retrieveValidatedCommits).mockReturnValueOnce(VALIDATED_COMMITS_ITERATOR);

    await releasePackages();

    expect(CommitsGrouper).toHaveBeenCalledExactlyOnceWith({
      validatedCommits: VALIDATED_COMMITS_ITERATOR,
    });
  });

  describe('release operations for each set of commits grouped by commit scope', () => {
    it('should determine the release type based on the commits', async () => {
      await releasePackages();

      expect(vi.mocked(determineReleaseType)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(determineReleaseType))
        .toHaveBeenNthCalledWith(1, BUTTON_COMMITS);
      expect(vi.mocked(determineReleaseType))
        .toHaveBeenNthCalledWith(2, CARD_COMMITS);
    });

    it('should bump the version', async () => {
      const onError = vi.fn();
      await releasePackages({ onError });

      expect(vi.mocked(bumpVersion)).toHaveBeenCalledTimes(2);
      expect(vi.mocked(bumpVersion)).toHaveBeenNthCalledWith(
        1,
        BUTTON_DIRECTORY_PATH,
        RELEASE_TYPE,
        {
          isUpdateReadme: true,
          onError,
        },
      );
      expect(vi.mocked(bumpVersion)).toHaveBeenNthCalledWith(
        2,
        CARD_DIRECTORY_PATH,
        RELEASE_TYPE,
        {
          isUpdateReadme: true,
          onError,
        },
      );
    });

    it('should write a changelog entry for the directory based on the commits', async () => {
      const BUTTON_VERSION = 'v.6.6.9';
      const CARD_VERSION = 'v6.7.6';
      vi.mocked(bumpVersion)
        .mockReturnValueOnce(BUTTON_VERSION)
        .mockReturnValueOnce(CARD_VERSION);

      await releasePackages();

      expect(mockWriteChangelog).toHaveBeenCalledTimes(2);
      expect(mockWriteChangelog).toHaveBeenNthCalledWith(
        1,
        BUTTON_DIRECTORY_PATH,
        BUTTON_VERSION,
        RELEASE_TYPE,
        BUTTON_COMMITS,
      );
      expect(mockWriteChangelog).toHaveBeenNthCalledWith(
        2,
        CARD_DIRECTORY_PATH,
        CARD_VERSION,
        RELEASE_TYPE,
        CARD_COMMITS,
      );
    });

    it('should not release when no package directory exists for the commit scope', async () => {
      await releasePackages();

      expect(mockWriteChangelog).toHaveBeenCalledTimes(2);
      expect(mockWriteChangelog).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        DRAWER_COMMITS,
      );
    });

    it('should not release when the user wants to perform a dry run', async () => {
      await releasePackages({ isDryRun: true });

      expect(determineReleaseType).toHaveBeenCalledTimes(2);
      expect(vi.mocked(bumpVersion)).not.toHaveBeenCalled();
      expect(mockWriteChangelog).not.toHaveBeenCalled();
    });

    it('should skip release operations when the commits do not warrant a release', async () => {
      vi.mocked(determineReleaseType)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null);

      await releasePackages();

      expect(determineReleaseType).toHaveBeenCalledTimes(2);
      expect(vi.mocked(bumpVersion)).not.toHaveBeenCalled();
      expect(mockWriteChangelog).not.toHaveBeenCalled();
    });
  });

  it('should handle any possible errors thrown by the writeChangelog operations', async () => {
    const writeChangelogError = new Error('Failed to write changelog');
    mockWriteChangelog
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(Promise.reject(writeChangelogError));
    const onError = vi.fn();

    await releasePackages({ onError });

    expect(vi.mocked(logRejectedPromises))
      .toHaveBeenCalledExactlyOnceWith([
        {
          status: 'fulfilled',
          value: undefined,
        },
        {
          reason: writeChangelogError,
          status: 'rejected',
        },
      ], onError, 'A package release failed.');
  });

  it('should not handle errors if the user opted out of error handling', async () => {
    const writeChangelogError = new Error('Failed to release package');
    mockWriteChangelog.mockResolvedValueOnce(Promise.reject(writeChangelogError));

    await releasePackages({ onError: null });

    expect(vi.mocked(logRejectedPromises)).not.toHaveBeenCalled();
  });
});
