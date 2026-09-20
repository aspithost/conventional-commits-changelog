import type { ErrorHandler } from '@/utils/error/logError.js';
import { ChangelogWriter, type ChangelogWriterOptions } from '@/write-changelog/ChangelogWriter.js';

export function createChangelogWriter(
  changelogWriterOptions?: Partial<ChangelogWriterOptions>,
  onError?: ErrorHandler,
): ChangelogWriter {
  const { remoteRepositoryInformation } = changelogWriterOptions?.options ?? {};
  const changelogWriter = changelogWriterOptions?.changelogWriterPreset
    ? new ChangelogWriter(
      changelogWriterOptions.changelogWriterPreset,
      {
        remoteRepositoryInformation,
        onError,
      },
    ) : ChangelogWriter.withDefaultPreset(
      remoteRepositoryInformation,
      onError,
    );

  return changelogWriter;
}
