import type { ValidatedCommit } from '../../commits/validate-commits/CommitsValidator.js';
import type { OnError } from '../../utils/error/types/error.js';
import { bumpVersion } from '../../version/bumpVersion.js';
import { determineReleaseType } from '../utils/determineReleaseType.js';

import { release } from './release.js';
import type { BaseReleaseOptions } from './schemas/releaseOptions.js';
import { validateReleaseInput } from './utils/validateReleaseInput.js';

const BUTTON_FEAT_COMMIT = vi.hoisted(() => ({
  scope: 'button',
  type: 'feat',
} as unknown as ValidatedCommit));
const BUTTON_FIX_COMMIT = vi.hoisted(() => ({
  scope: 'button',
  type: 'fix',
} as unknown as ValidatedCommit));
const BUTTON_COMMITS = vi.hoisted(() => [BUTTON_FEAT_COMMIT, BUTTON_FIX_COMMIT]);
vi.mock('../../commits/utils/retrieveValidatedCommits.js', () => ({
  retrieveValidatedCommits: vi.fn(() => BUTTON_COMMITS),
}));

vi.mock('../../version/bumpVersion.js', () => ({
  bumpVersion: vi.fn(),
}));

vi.mock('../utils/determineReleaseType.js', () => ({
  determineReleaseType: vi.fn(() => 'minor'),
}));

const { mockWriteChangelog } = vi.hoisted(() => ({
  mockWriteChangelog: vi.fn(),
}));

vi.mock('../../write-changelog/utils/createChangelogWriter.js', () => ({
  createChangelogWriter: () => ({
    writeChangelog: mockWriteChangelog,
  }),
}));

vi.mock('./utils/validateReleaseInput.js', () => ({
  validateReleaseInput: vi.fn(),
}));

describe('release', () => {
  describe('validate release input', () => {
    it('should validate user input parameters', () => {
      const RELEASE_INPUT: BaseReleaseOptions = {
        changelogWriterOptions: {},
        directoryPath: '/some-path',
        isDryRun: false,
        isUpdateReadme: false,
        releaseType: 'patch',
        releaseVersion: '1.2.3',
      };

      expect(() => release(RELEASE_INPUT)).not.toThrow();
      expect(validateReleaseInput).toHaveBeenCalledExactlyOnceWith(RELEASE_INPUT);
    });
  });

  describe('determine release type', () => {
    it('should determine the release type based on the retrieved validated commits', async () => {
      await release();

      expect(determineReleaseType).toHaveBeenCalledWith(BUTTON_COMMITS);
    });

    it(
      'should not retrieve commits, but determine the release type based on passed in commits',
      async () => {
        const SINGLE_COMMIT = BUTTON_COMMITS[0];

        await release({ commits: [SINGLE_COMMIT] });

        expect(determineReleaseType).toHaveBeenCalledWith([SINGLE_COMMIT]);
      },
    );

    it(
      'should not determine the release type if the user manually passes a release type',
      async () => {
        await release({ releaseType: 'patch' });

        expect(determineReleaseType).not.toHaveBeenCalled();
      },
    );

    it(
      'should default to a patch release if the validated commits do not warrant a release',
      async () => {
        vi.mocked(determineReleaseType).mockReturnValueOnce(null);

        await release();
        expect(determineReleaseType).toHaveBeenCalledTimes(1);

        expect(bumpVersion).toHaveBeenCalledExactlyOnceWith(
          expect.any(String),
          'patch',
          expect.any(Object),
        );
        expect(mockWriteChangelog).toHaveBeenCalledExactlyOnceWith(
          expect.any(String),
          undefined,
          'patch',
          expect.any(Object),
        );
      },
    );
  });

  describe('bumping the version', () => {
    it(
      'should bump the version for the default directory and based on the determined release type',
      async () => {
        const RELEASE_TYPE = 'major';
        vi.mocked(determineReleaseType).mockReturnValueOnce(RELEASE_TYPE);

        await release();

        expect(bumpVersion).toHaveBeenCalledWith(
          process.cwd(),
          RELEASE_TYPE,
          expect.any(Object),
        );
      },
    );

    it(
      'should bump the version based on the release type specified by the user',
      async () => {
        const RELEASE_TYPE = 'major';
        await release({ releaseType: RELEASE_TYPE });

        expect(determineReleaseType).not.toHaveBeenCalled();
        expect(vi.mocked(bumpVersion)).toHaveBeenCalledWith(
          expect.any(String),
          RELEASE_TYPE,
          expect.objectContaining({
            isUpdateReadme: false,
            onError: expect.any(Function) as OnError,
          }),
        );
      },
    );

    it('should bump the version based on the release version specified by the user', async () => {
      // Note: release version takes precedence over release type when user specifies both
      const RELEASE_VERSION = '3.4.5';
      const RELEASE_TYPE = 'major';
      await release({
        releaseVersion: RELEASE_VERSION,
        releaseType: RELEASE_TYPE,
      });

      expect(determineReleaseType).not.toHaveBeenCalled();
      expect(vi.mocked(bumpVersion)).toHaveBeenCalledWith(
        process.cwd(),
        RELEASE_VERSION,
        expect.objectContaining({
          isUpdateReadme: false,
          onError: expect.any(Function) as OnError,
        }),
      );
    });

    it('should bump the version with a custom directory path', async () => {
      const DIRECTORY_PATH = 'path/to/directory';
      await release({ directoryPath: DIRECTORY_PATH });

      expect(determineReleaseType).toHaveBeenCalledOnce();
      expect(vi.mocked(bumpVersion))
        .toHaveBeenCalledWith(
          DIRECTORY_PATH,
          'minor',
          expect.objectContaining({ isUpdateReadme: false }),
        );
    });

    it('should not update the readme, if specified by the user', async () => {
      await release({ isUpdateReadme: false });

      expect(vi.mocked(bumpVersion))
        .toHaveBeenCalledWith(
          process.cwd(),
          'minor',
          expect.objectContaining({ isUpdateReadme: false }),
        );
    });

    it('should not bump the version if the user wants to perform a dry run', async () => {
      console.log = vi.fn(); // Note: suppress console output for this test
      await release({ isDryRun: true });

      expect(determineReleaseType).toHaveBeenCalledOnce();
      expect(bumpVersion).not.toHaveBeenCalled();
    });
  });

  describe('write changelog', () => {
    const RELEASE_TYPE = 'patch';
    const RELEASE_VERSION = 'v1.1.1';
    beforeEach(() => {
      vi.mocked(determineReleaseType).mockReturnValueOnce(RELEASE_TYPE);
      vi.mocked(bumpVersion).mockReturnValueOnce(RELEASE_VERSION);
    });

    it('should retrieve validated commits and write changelog entries', async () => {
      await release();

      expect(mockWriteChangelog).toHaveBeenCalledExactlyOnceWith(
        process.cwd(),
        RELEASE_VERSION,
        RELEASE_TYPE,
        BUTTON_COMMITS,
      );
    });

    it('should write the changelog entries based on commits passed by the user', async () => {
      const SINGLE_COMMIT = BUTTON_COMMITS[0];

      await release({ commits: [SINGLE_COMMIT] });

      expect(mockWriteChangelog).toHaveBeenCalledExactlyOnceWith(
        process.cwd(),
        RELEASE_VERSION,
        RELEASE_TYPE,
        [SINGLE_COMMIT],
      );
    });
  });
});
