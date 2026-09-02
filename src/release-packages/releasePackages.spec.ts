import { CommitsGrouper } from '@/commits/group-commits/CommitsGrouper.js';
import { retrieveValidatedCommits } from '@/commits/retrieveValidatedCommits.js';
import { DirectoriesReader } from '@/read-directories/DirectoriesReader.js';
import { releasePackages } from './releasePackages.js';
import { getAllowedCommitScopes } from './utils/getAllowedCommitScopes.js';
import { handleReleasePackagesErrors } from './utils/handleReleaseErrors.js';
import { releaseByScope } from './utils/releaseByScope.js';

const BUTTON_SCOPE = vi.hoisted(() => 'button');
const CARD_SCOPE = vi.hoisted(() => 'card');
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

vi.mock('@/commits/group-commits/CommitsGrouper.js', () => {
  const CommitsGrouper = vi.fn(class {
    commitsByScopeMap = COMMIT_BY_SCOPE_MAP;
  });
  return { CommitsGrouper };
});

vi.mock('@/commits/retrieveValidatedCommits.js', () => ({
  retrieveValidatedCommits: vi.fn(() => []),
}));

vi.mock('@/read-directories/DirectoriesReader.js', () => {
  const DirectoriesReader = vi.fn(class {
    directoryPathByScopeMap = DIRECTORY_PATH_BY_SCOPE_MAP;
    scopes = DIRECTORY_PATH_BY_SCOPE_MAP.keys();
  });
  return { DirectoriesReader };
});

vi.mock('./utils/getAllowedCommitScopes.js', () => ({
  getAllowedCommitScopes: vi.fn(() => new Set(['button', 'card'])),
}));

vi.mock('./utils/releaseByScope.js', () => ({
  releaseByScope: vi.fn(),
}));

vi.mock('./utils/handleReleaseErrors.js', () => ({
  handleReleasePackagesErrors: vi.fn(),
}));

describe('releasePackages', () => {
  describe('reading directories', () => {
    it('should read the directories in the provided directory path', async () => {
      const onError = vi.fn();
      const DIRECTORY_PATH = 'packages';

      await releasePackages({ directoryPath: DIRECTORY_PATH, onError });

      expect(DirectoriesReader).toHaveBeenCalledWith({
        directoryPath: DIRECTORY_PATH,
        onError,
      });
    });

    it('should throw an error if the user does not have any folders with a package.json file in the provided scope', async () => {
      // @ts-expect-error: Simplified mock of DirectoriesReader class
      vi.mocked(DirectoriesReader).mockImplementationOnce(class DirectoriesReader {
        directoryPathByScopeMap = new Map();
      });

      await expect(releasePackages()).rejects.toThrow(new Error('No scopes found in the specified directory'));
    });
  });

  describe('retrieving and validating commits', () => {
    it('should allow commits with scopes found in the provided directory path', async () => {
      await releasePackages();

      expect(getAllowedCommitScopes).toHaveBeenCalledExactlyOnceWith(
        DIRECTORY_PATH_BY_SCOPE_MAP.keys(),
        undefined,
      );
    });

    it('should filter out commits with scopes that do not match the allowed commit scopes provided by the user', async () => {
      const ALLOWED_SCOPES = [BUTTON_SCOPE, CARD_SCOPE] as const;

      await releasePackages({ commitsValidatorOptions: { allowedCommitScopes: ALLOWED_SCOPES } });

      expect(getAllowedCommitScopes).toHaveBeenCalledExactlyOnceWith(
        DIRECTORY_PATH_BY_SCOPE_MAP.keys(),
        ALLOWED_SCOPES,
      );

      expect(vi.mocked(retrieveValidatedCommits)).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          commitsValidatorOptions: expect.objectContaining({
            allowedCommitScopes: ALLOWED_SCOPES,
          }),
        }),
      );
    });
  });

  it('should group commits by scope', async () => {
    const allowedCommitScopes = [BUTTON_SCOPE, CARD_SCOPE];
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
      { status: 'fulfilled', value: undefined },
      { status: 'rejected', reason: new Error('Failed to release package') },
    ];
    vi.mocked(releaseByScope).mockResolvedValueOnce(releasePackagesResult);
    const onError = vi.fn();

    await releasePackages({ onError});

    expect(vi.mocked(handleReleasePackagesErrors)).toHaveBeenCalledExactlyOnceWith(releasePackagesResult, onError);
  });
});
