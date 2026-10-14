import type { TagEntry } from '../generateChangelog.js';
import type { GenerateChangelogOptions } from '../types/generateChangelog.js';

import {
  getReleaseTypeBetweenTags, parseSemverVersion,
} from './version/version.js';

import { retrieveValidatedCommits } from '@/commits/retrieveValidatedCommits.js';
import { createChangelogWriter } from '@/write-changelog/utils/createChangelogWriter.js';

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
): Promise<PromiseSettledResult<void>[]> {
  const changelogWriter = createChangelogWriter(changelogWriterOptions);

  const changelogWriterPromises: Promise<void>[] = [];

  for (const {
    tag, previousTag, date,
  } of tagEntries) {
    const commits = [
      ...retrieveValidatedCommits({
        commitsParserOptions,
        commitsRetrieverOptions: {
          ...commitsRetrieverOptions,
          cwd: directoryPath,
          from: previousTag ?? null,
          to: tag,
          onError,
        },
        commitsValidatorOptions,
        onError,
      }),
    ];

    changelogWriterPromises.push(changelogWriter.writeChangelog(
      directoryPath,
      parseSemverVersion(tag),
      getReleaseTypeBetweenTags(tag, previousTag),
      commits,
      { date },
    ));
  }
  return Promise.allSettled(changelogWriterPromises);
}
