import { retrieveValidatedCommits } from '../commits/retrieveValidatedCommits.js';
import type { ValidatedCommitWithScopeAndType } from '../commits/validate-commits/types/commit.js';

import { release } from './release.js';

import { bumpVersion } from '@/version/bumpVersion.js';
import { determineReleaseType } from '@/release/utils/determineReleaseType.js';

vi.mock('@/commits/retrieveValidatedCommits.js', () => ({
  retrieveValidatedCommits: vi.fn(),
}));

vi.mock('@/version/bumpVersion.js', () => ({
  bumpVersion: vi.fn(),
}));

vi.mock('@/release/utils/determineReleaseType.js', () => ({
  determineReleaseType: vi.fn(),
}));

const { mockWriteChangelog } = vi.hoisted(() => ({
  mockWriteChangelog: vi.fn(),
}));

vi.mock('@/release/utils/createChangelogWriter.js', () => ({
  createChangelogWriter: () => ({
    writeChangelog: mockWriteChangelog,
  }),
}));

const BUTTON_FEAT_COMMIT = {
  scope: 'button',
  type: 'feat',
} as unknown as ValidatedCommitWithScopeAndType<string, string>;
const BUTTON_FIX_COMMIT = {
  scope: 'button',
  type: 'fix',
} as unknown as ValidatedCommitWithScopeAndType<string, string>;
const BUTTON_COMMITS = [BUTTON_FEAT_COMMIT, BUTTON_FIX_COMMIT];

describe('release', () => {
  beforeEach(() => {
    vi.mocked(retrieveValidatedCommits).mockReturnValue(BUTTON_COMMITS);
  });

  describe('determine release type', () => {
    beforeEach(() => {
      vi.mocked(determineReleaseType).mockReturnValue('patch');
    });

    it('should determine the release type based on the retrieved validated commits', async () => {
      await release();

      expect(determineReleaseType).toHaveBeenCalledWith(BUTTON_COMMITS);
    });

    it('should not retrieve commits, but determine the release type based on passed in commits',
      async () => {
        const SINGLE_COMMIT = BUTTON_COMMITS[0];

        await release({ commits: [SINGLE_COMMIT] } );

        expect(determineReleaseType).toHaveBeenCalledWith([SINGLE_COMMIT]);
      },
    );

    it('should not determine the release type if the user manually passes a release type',
      async () => {
        await release({ releaseType: 'patch' });

        expect(determineReleaseType).not.toHaveBeenCalled();
      },
    );

    it('should not release if the validated commits do not contain types that warrant a release',
      async () => {
        vi.mocked(determineReleaseType).mockReturnValue(null);
        const onError = vi.fn();

        await release({ onError });

        expect(determineReleaseType).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledExactlyOnceWith(
          expect.any(String),
          expect.any(Error),
        );
        expect(bumpVersion).not.toHaveBeenCalled();
        expect(mockWriteChangelog).not.toHaveBeenCalled();
      },
    );
  });

  describe('bumping the version', () => {
    it('should bump the version based on the determined release type', () => {
      vi.mocked(determineReleaseType).mockReturnValue('minor');
    });

    it('should bump the version based on the desired release type specified by the user',
      async () => {
        await release();

        expect(vi.mocked(bumpVersion)).toHaveBeenCalledWith(
          process.cwd(),
          'minor',
          { isUpdateReadme: true },
        );
      },
    );

    it('should bump the version with a custom directory path', async () => {
      const DIRECTORY_PATH = 'path/to/directory';
      await release({ directoryPath: DIRECTORY_PATH });

      expect(vi.mocked(bumpVersion))
        .toHaveBeenCalledWith(DIRECTORY_PATH, 'minor', { isUpdateReadme: true });
    });

    it('should not update the readme, if specified by the user', async () => {
      await release({ isUpdateReadme: false });

      expect(vi.mocked(bumpVersion))
        .toHaveBeenCalledWith(process.cwd(), 'minor', { isUpdateReadme: false });
    });

    it('should not bump the version if the user wants to perform a dry run', async () => {
      console.log = vi.fn(); // Note: suppress console output for this test
      await release({ isDryRun: true });

      expect(determineReleaseType).toHaveBeenCalledTimes(1);
      expect(bumpVersion).not.toHaveBeenCalled();
    });
  });

  describe('write changelog', () => {
    beforeEach(() => {
      vi.mocked(determineReleaseType).mockReturnValue('patch');
      vi.mocked(bumpVersion).mockReturnValue('v1.1.1');
    });

    it('should retrieve validated commits and write changelog entries', async () => {
      await release();

      expect(mockWriteChangelog).toHaveBeenCalledExactlyOnceWith(
        process.cwd(),
        'v1.1.1',
        'patch',
        BUTTON_COMMITS,
      );
    });

    it('should write the changelog entries based on commits passed by the user', async () => {
      const SINGLE_COMMIT = BUTTON_COMMITS[0];

      await release({ commits: [SINGLE_COMMIT] });

      expect(mockWriteChangelog).toHaveBeenCalledExactlyOnceWith(
        process.cwd(),
        'v1.1.1',
        'patch',
        [SINGLE_COMMIT],
      );
    });
  });
});
