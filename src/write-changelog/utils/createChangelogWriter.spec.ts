import { createChangelogWriter } from './createChangelogWriter.js';

import {
  ChangelogWriter,
  type ChangelogWriterPreset,
} from '@/write-changelog/ChangelogWriter.js';

const REMOTE_REPOSITORY_INFORMATION = {
  host: 'somesite.com',
  owner: 'someguy',
  repository: 'somrepo',
};
vi.mock('@/write-changelog/ChangelogWriter.js');

describe('createChangelogWriter', () => {
  it('should create and return a ChangelogWriter with default parameters', () => {
    const { withDefaultPreset } = vi.mocked(ChangelogWriter);

    createChangelogWriter();

    expect(withDefaultPreset).toHaveBeenCalledTimes(1);
  });

  it('should create and return a ChangelogWriter with parameters specified by the user', () => {
    const CHANGELOG_WRITER_PRESET = { someKey: 'someValue' } as unknown as ChangelogWriterPreset;
    const changelogWriterOptions = {
      changelogWriterPreset: CHANGELOG_WRITER_PRESET,
      remoteRepositoryInformation: REMOTE_REPOSITORY_INFORMATION,
    };

    createChangelogWriter(changelogWriterOptions);

    expect(vi.mocked(ChangelogWriter)).toHaveBeenCalledExactlyOnceWith(changelogWriterOptions);
    const { withDefaultPreset } = vi.mocked(ChangelogWriter);
    expect(withDefaultPreset).not.toHaveBeenCalled();
  });
});
