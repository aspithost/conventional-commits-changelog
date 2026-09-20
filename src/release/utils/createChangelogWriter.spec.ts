import {
  ChangelogWriter,
  type ChangelogWriterPreset,
  type RemoteRepositoryInformation,
} from '@/write-changelog/ChangelogWriter.js';
import { createChangelogWriter } from './createChangelogWriter.js';

const REMOTE_REPOSITORY_INFORMATION: RemoteRepositoryInformation = {
  host: 'somesite.com',
  owner: 'someguy',
  repository: 'somrepo',
};
const CHANGELOG_WRITER_OPTIONS = {
  options: {
    remoteRepositoryInformation: REMOTE_REPOSITORY_INFORMATION,
  },
};
vi.mock('@/write-changelog/ChangelogWriter.js');

describe('createChangelogWriter', () => {
  it('should create and return a ChangelogWriter with default parameters', () => {
    const onError = vi.fn();
    const { withDefaultPreset } = vi.mocked(ChangelogWriter);

    createChangelogWriter(
      undefined,
      onError,
    );

    expect(withDefaultPreset).toHaveBeenCalledExactlyOnceWith(
      undefined,
      onError,
    );
  });

  it('should create and return a ChangelogWriter with parameters specified by the user', () => {
    const onError = vi.fn();
    const CHANGELOG_WRITER_PRESET = { someKey: 'someValue' } as unknown as ChangelogWriterPreset;
    const changelogWriterOptions = {
      changelogWriterPreset: CHANGELOG_WRITER_PRESET,
      ...CHANGELOG_WRITER_OPTIONS,
    };

    createChangelogWriter(changelogWriterOptions, onError);

    expect(vi.mocked(ChangelogWriter)).toHaveBeenCalledWith(
      changelogWriterOptions.changelogWriterPreset,
      {
        remoteRepositoryInformation: REMOTE_REPOSITORY_INFORMATION,
        onError,
      },
    );
    const { withDefaultPreset } = vi.mocked(ChangelogWriter);
    expect(withDefaultPreset).not.toHaveBeenCalled();
  });
});
