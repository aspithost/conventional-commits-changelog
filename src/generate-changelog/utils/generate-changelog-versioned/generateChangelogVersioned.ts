import { retrieveValidatedCommits } from '../../../commits/retrieveValidatedCommits.js';
import { createChangelogWriter } from '../../../write-changelog/utils/createChangelogWriter.js';
import type { TagEntry } from '../../generateChangelog.js';
import type { GenerateChangelogOptions } from '../../types/generateChangelog.js';
import {
  getReleaseTypeBetweenTags, parseSemverVersion,
} from '../version/version.js';

export async function generateChangelogVersioned(
  tagEntries: TagEntry[],
  {
    commitsParserOptions,
    changelogWriterOptions,
    commitsRetrieverOptions,
    commitsValidatorOptions,
    directoryPath,
    onError,
  }: GenerateChangelogOptions<string, string> & { directoryPath: string },
) {
  const changelogWriter = createChangelogWriter(changelogWriterOptions);

  await tagEntries.reduce<Promise<void>>(
    async (previousChangelogEntry, {
      date,
      previousVersion,
      targetVersion,
    }) => {
      await previousChangelogEntry;

      try {
        await changelogWriter.writeChangelog(
          directoryPath,
          parseSemverVersion(targetVersion),
          getReleaseTypeBetweenTags(targetVersion, previousVersion),
          retrieveValidatedCommits({
            commitsParserOptions,
            commitsRetrieverOptions: {
              ...commitsRetrieverOptions,
              cwd: directoryPath,
              from: previousVersion ?? null,
              to: targetVersion,
              onError,
            },
            commitsValidatorOptions,
            onError,
          }),
          { date },
        );
      } catch (err) {
        onError?.(
          `Failed to generate changelog entry for version ${targetVersion}`,
          { cause: err },
        );
      }
    },
    Promise.resolve(),
  );
}
