import {
  ChangelogWriter,
  type ChangelogWriterOptions,
} from '../../write-changelog/ChangelogWriter.js';

export function createChangelogWriter(
  changelogWriterOptions?: Partial<ChangelogWriterOptions>,
): ChangelogWriter {
  const { changelogWriterPreset, remoteRepositoryInformation } = changelogWriterOptions ?? {};
  const changelogWriter = changelogWriterPreset
    ? new ChangelogWriter(
      {
        changelogWriterPreset,
        remoteRepositoryInformation,
      },
    ) : ChangelogWriter.withDefaultPreset({
      remoteRepositoryInformation,
    });

  return changelogWriter;
}
