import type { ErrorHandler } from '@/utils/error/logError.js';
import { ChangelogWriter, type ChangelogWriterOptions } from '@/write-changelog/ChangelogWriter.js';

export async function createChangelogWriter(
  changelogWriterOptions?: Partial<ChangelogWriterOptions>,
  onError?: ErrorHandler,
): Promise<ChangelogWriter> {
  const { remoteRepositoryInformation } = changelogWriterOptions?.options ?? {};
  const changelogWriter = changelogWriterOptions?.changelogWriterPreset
    ? new ChangelogWriter(
      changelogWriterOptions.changelogWriterPreset,
      {
        remoteRepositoryInformation,
        onError,
      },
    ) : await ChangelogWriter.withDefaultPreset(
      remoteRepositoryInformation,
      onError,
    );

  return changelogWriter;
}
