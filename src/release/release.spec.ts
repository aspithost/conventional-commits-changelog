import { retrieveValidatedCommits } from '@/shared/commits/retrieveValidatedCommits.js';
import { bumpVersion } from '@/version/bump-version/bumpVersion.js';
import { determineReleaseType } from '@/version/determine-release-type/determineReleaseType.js';
import { ChangelogWriter, type ChangelogWriterPreset, type RemoteRepositoryInformation } from '@/write-changelog/ChangelogWriter.js';
import type { ValidatedCommit } from '@/shared/commits/validate-commits/types/commits.js';

import { release } from './release.js';

vi.mock('@/shared/commits/retrieveValidatedCommits.js', () => ({
  retrieveValidatedCommits: vi.fn(),
}));

vi.mock('@/version/bump-version/bumpVersion.js', () => ({
  bumpVersion: vi.fn(),
}));

vi.mock('@/version/determine-release-type/determineReleaseType.js', () => ({
  determineReleaseType: vi.fn(),
}));

vi.mock('@/write-changelog/ChangelogWriter.js', () => {
  const ChangelogWriter = vi.fn(class {
    static withDefaultPreset = vi.fn().mockResolvedValue({ // NOSONAR
      writeChangelog: vi.fn(),
    });

    writeChangelog = vi.fn();
  });

  return { ChangelogWriter };
});

const BUTTON_FEAT_COMMIT = {
  scope: 'button',
  type: 'feat',
} as unknown as ValidatedCommit<string, string>; // Type casting for unit testing purposes
const BUTTON_FIX_COMMIT = {
  scope: 'button',
  type: 'fix',
} as unknown as ValidatedCommit<string, string>; // Type casting for unit testing purposes
const BUTTON_COMMITS = [BUTTON_FEAT_COMMIT, BUTTON_FIX_COMMIT];

const REMOTE_REPOSITORY_INFORMATION: RemoteRepositoryInformation = {
  host: 'somesite.com',
  owner: 'someguy',
  repository: 'somrepo',
};

describe('release', () => {
  beforeEach(() => {
    vi.mocked(retrieveValidatedCommits).mockReturnValue(BUTTON_COMMITS);
  });

  describe('determine release type', () => {
    it('should determine the release type based on the retrieved validated commits', async () => {
      await release();

      expect(determineReleaseType).toHaveBeenCalledWith(BUTTON_COMMITS);
    });

    it('should not retrieve commits and determine the release type based on the commits passed in by the user', async () => {
      const SINGLE_COMMIT = BUTTON_COMMITS[0];

      await release({ commits: [SINGLE_COMMIT]} );

      expect(determineReleaseType).toHaveBeenCalledWith([SINGLE_COMMIT]);
    });

    it('should not determine the release type if the user manually passes a release type', async () => {
      await release({ releaseType: 'patch' });

      expect(determineReleaseType).not.toHaveBeenCalled();
    });

    it('should not release if the validated commits do not contain types that warrant a release', async () => {
      vi.mocked(determineReleaseType).mockReturnValue(null);

      await release();

      expect(determineReleaseType).toHaveBeenCalledTimes(1);
      expect(bumpVersion).not.toHaveBeenCalled();
      // to-do: check if writer was called
    });
  });

  describe('bumping the version', () => {
    it('should bump the version based on the determined release type', () => {
      vi.mocked(determineReleaseType).mockReturnValue('minor');
    });

    it('should bump the version based on the desired release type specified by the user', async () => {
      await release();

      expect(vi.mocked(bumpVersion)).toHaveBeenCalledWith(process.cwd(), 'minor', { isUpdateReadme: true });
    });

    it('should bump the version with a custom directory path', async () => {
      const DIRECTORY_PATH = 'path/to/directory';
      await release({ bumpVersionOptions: { directoryPath: DIRECTORY_PATH }});

      expect(vi.mocked(bumpVersion)).toHaveBeenCalledWith(DIRECTORY_PATH, 'minor', { isUpdateReadme: true });
    });

    it('should not update the readme, if specified by the user', async () => {
      await release({ bumpVersionOptions: { isUpdateReadme: false }});

      expect(vi.mocked(bumpVersion)).toHaveBeenCalledWith(process.cwd(), 'minor', { isUpdateReadme: false });
    });

    it('should not bump the version if the user wants to perform a dry run', async () => {
      await release({ bumpVersionOptions: { isDryRun: true } });

      expect(determineReleaseType).toHaveBeenCalledTimes(1);
      expect(bumpVersion).not.toHaveBeenCalled();
    });
  });

  describe('write changelog', () => {
    beforeEach(() => {
      vi.mocked(determineReleaseType).mockReturnValue('patch');
      vi.mocked(bumpVersion).mockReturnValue('v1.1.1');
    });

    it('should use a ChangelogWriter with default parameters', async () => {
      const { withDefaultPreset } = vi.mocked(ChangelogWriter);
      await release();

      expect(withDefaultPreset).toHaveBeenCalledTimes(1);
    });

    it('should use a ChangelogWriter with parameters specified by the user', async () => {
      const CHANGELOG_WRITER_PRESET = { someKey: 'someValue' } as unknown as ChangelogWriterPreset;

      await release({ changelogWriterOptions: {
        changelogWriterPreset: CHANGELOG_WRITER_PRESET,
        remoteRepositoryInformation: REMOTE_REPOSITORY_INFORMATION,
      }});

      expect(vi.mocked(ChangelogWriter)).toHaveBeenCalledWith(CHANGELOG_WRITER_PRESET, REMOTE_REPOSITORY_INFORMATION);
    });

    it('should retrieve validated commits and write changelog entries', async () => {
      const { withDefaultPreset } = vi.mocked(ChangelogWriter);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { writeChangelog } = vi.mocked(await withDefaultPreset());

      await release();

      expect(writeChangelog).toHaveBeenCalledTimes(1);
      expect(writeChangelog).toHaveBeenCalledWith(
        process.cwd(),
        'v1.1.1',
        'patch',
        BUTTON_COMMITS,
      );
    });

    it('should write the changelog entries based on commits passed by the user', async () => {
      const SINGLE_COMMIT = BUTTON_COMMITS[0];

      await release({ commits: [SINGLE_COMMIT] });

      const { withDefaultPreset } = vi.mocked(ChangelogWriter);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { writeChangelog } = vi.mocked(await withDefaultPreset());
      expect(writeChangelog).toHaveBeenCalledTimes(1);
      expect(writeChangelog).toHaveBeenCalledWith(
        process.cwd(),
        'v1.1.1',
        'patch',
        [SINGLE_COMMIT],
      );
    });
  });
});
