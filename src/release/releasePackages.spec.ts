import { CommitsGrouper } from '../commits/group-commits/CommitsGrouper.js';
import { retrieveValidatedCommits } from '../commits/retrieveValidatedCommits.js';
import { DirectoriesReader } from '../read-directories/DirectoriesReader.js';

import { getAllowedCommitsScopes } from './release-packages/utils/getAllowedCommitsScopes.js';
import { getFilteredCommitsScopes } from './release-packages/utils/getFilteredCommitsScopes.js';
import { logRejectedPromises } from './release-packages/utils/logRejectedPromises.js';
import { releaseByScope } from './release-packages/utils/releaseByScope.js';
import { releasePackages } from './releasePackages.js';

const BUTTON_SCOPE = vi.hoisted(() => '@some-scope/button');
const CARD_SCOPE = vi.hoisted(() => '@some-other-scope/card');
const DRAWER_SCOPE = vi.hoisted(() => 'drawer');
const BUTTON_DIRECTORY_PATH = vi.hoisted(() => 'button-directory-path');
const CARD_DIRECTORY_PATH = vi.hoisted(() => 'card-directory-path');
const DRAWER_DIRECTORY_PATH = vi.hoisted(() => 'drawer-directory-path');

const COMMIT_BY_SCOPE_MAP = vi.hoisted(() => new Map([
  [BUTTON_SCOPE, []],
  [CARD_SCOPE, []],
]));

const DIRECTORY_PATH_BY_SCOPE_MAP = vi.hoisted(() => new Map([
  [BUTTON_SCOPE, { directoryPath: BUTTON_DIRECTORY_PATH }],
  [CARD_SCOPE, { directoryPath: CARD_DIRECTORY_PATH }],
  [DRAWER_SCOPE, { directoryPath: DRAWER_DIRECTORY_PATH }],
]));

vi.mock('../commits/group-commits/CommitsGrouper.js', () => {
  const CommitsGrouper = vi.fn(class {
    commitsByScopeMap = COMMIT_BY_SCOPE_MAP;
  });
  return { CommitsGrouper };
});

vi.mock('../commits/retrieveValidatedCommits.js', () => ({
  retrieveValidatedCommits: vi.fn(() => []),
}));

vi.mock('../read-directories/DirectoriesReader.js', () => {
  const DirectoriesReader = vi.fn(class {
    directoryPathByScopeMap = DIRECTORY_PATH_BY_SCOPE_MAP;
    scopes = DIRECTORY_PATH_BY_SCOPE_MAP.keys();
  });
  return { DirectoriesReader };
});

vi.mock('./release-packages/utils/getAllowedCommitsScopes.js', () => ({
  getAllowedCommitsScopes: vi.fn(() => new Set([BUTTON_SCOPE, CARD_SCOPE])),
}));

vi.mock('./release-packages/utils/getFilteredCommitsScopes.js', () => ({
  getFilteredCommitsScopes: vi.fn((scopes: Iterable<string>) => new Set(scopes)),
}));

vi.mock('./release-packages/utils/releaseByScope.js', () => ({
  releaseByScope: vi.fn(),
}));

vi.mock('./release-packages/utils/logRejectedPromises.js', () => ({
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
          directoryPathByScopeMap = new Map();
        });

        await expect(releasePackages())
          .rejects
          .toThrow(new Error('No scopes found in the specified directory'));
      },
    );
  });

  describe('filtering out scope name from package names', () => {
    it('should filter out the scope name from package names if the user opts in', async () => {
      await releasePackages({
        directoriesReaderOptions: {
          isFilterScope: true,
        },
      });

      expect(vi.mocked(getFilteredCommitsScopes)).toHaveBeenCalledExactlyOnceWith(
        vi.mocked(DirectoriesReader).mock.instances[0].scopes,
        true,
      );
    });
  });

  describe('retrieving and validating commits', () => {
    it('should allow commits with scopes found in the provided directory path', async () => {
      await releasePackages();

      expect(getAllowedCommitsScopes).toHaveBeenCalledExactlyOnceWith(
        new Set(DIRECTORY_PATH_BY_SCOPE_MAP.keys()),
        undefined,
      );
    });

    it(
      'should filter out commits with scopes that do not match the allowed commit scopes',
      async () => {
        const allowedCommitScopes = new Set([BUTTON_SCOPE, CARD_SCOPE]);

        await releasePackages({ commitsValidatorOptions: { allowedCommitScopes } });

        expect(getAllowedCommitsScopes).toHaveBeenCalledExactlyOnceWith(
          new Set(DIRECTORY_PATH_BY_SCOPE_MAP.keys()),
          allowedCommitScopes,
        );

        expect(vi.mocked(retrieveValidatedCommits)).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            commitsValidatorOptions: expect.objectContaining({
              allowedCommitScopes,
            }),
          }),
        );
      },
    );
  });

  it('should group commits by scope', async () => {
    const allowedCommitScopes = new Set([BUTTON_SCOPE, CARD_SCOPE]);
    await releasePackages({ commitsValidatorOptions: { allowedCommitScopes } });

    expect(CommitsGrouper).toHaveBeenCalledExactlyOnceWith([], allowedCommitScopes);
  });

  it('should release packages for each found scope', async () => {
    const onError = vi.fn();
    const options = {
      isDryRun: true,
      onError,
    };

    await releasePackages(options);

    expect(vi.mocked(releaseByScope)).toHaveBeenCalledExactlyOnceWith(
      DIRECTORY_PATH_BY_SCOPE_MAP,
      COMMIT_BY_SCOPE_MAP,
      expect.objectContaining(options),
    );
  });

  it('should handle errors thrown by individual package releases', async () => {
    const releasePackagesResult: PromiseSettledResult<void>[] = [
      {
        status: 'fulfilled',
        value: undefined,
      },
      {
        status: 'rejected',
        reason: new Error('Failed to release package'),
      },
    ];
    vi.mocked(releaseByScope).mockResolvedValueOnce(releasePackagesResult);
    const onError = vi.fn();

    await releasePackages({ onError });

    expect(vi.mocked(logRejectedPromises))
      .toHaveBeenCalledExactlyOnceWith(releasePackagesResult, onError, 'A package release failed.');
  });

  it('should not handle errors if the user opted out of error handling', async () => {
    const releasePackagesResult: PromiseSettledResult<void>[] = [
      {
        status: 'rejected',
        reason: new Error('Failed to release package'),
      },
    ];
    vi.mocked(releaseByScope).mockResolvedValueOnce(releasePackagesResult);

    await releasePackages({ onError: null });

    expect(vi.mocked(logRejectedPromises)).not.toHaveBeenCalled();
  });
});
