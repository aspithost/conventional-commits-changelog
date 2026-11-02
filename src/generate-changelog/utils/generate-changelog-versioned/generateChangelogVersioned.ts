import { retrieveValidatedCommits } from '../../../commits/utils/retrieveValidatedCommits.js';
import { createChangelogWriter } from '../../../write-changelog/utils/createChangelogWriter.js';
import type { GenerateChangelogOptions } from '../../types/generateChangelog.js';
import type { TagEntry } from '../tags/formatTagEntries.js';
import {
  getReleaseTypeBetweenTags,
} from '../tags/get-release-type-between-tags/getReleaseTypeBetweenTags.js';
import {
  parseSemverVersionFromTag,
} from '../tags/parse-semver-version-from-tag/parseSemverVersionFromTag.js';

export async function generateChangelogVersioned(
  tagEntries: TagEntry[],
  {
    commitsParserOptions,
    changelogWriterOptions,
    commitsRetrieverOptions,
    directoryPath,
    tagRetrieverOptions,
    onError,
  }: GenerateChangelogOptions & { directoryPath: string },
) {
  const changelogWriter = createChangelogWriter(changelogWriterOptions);

  await tagEntries.reduce<Promise<void>>(
    async (previousChangelogEntry, {
      date,
      tagPrevious,
      tagCurrent,
    }) => {
      await previousChangelogEntry;

      const versionCurrent = parseSemverVersionFromTag(tagCurrent);
      const releaseType = getReleaseTypeBetweenTags(
        versionCurrent,
        tagPrevious ? parseSemverVersionFromTag(tagPrevious) : undefined,
      );
      const validatedCommitsIterator = retrieveValidatedCommits({
        commitsParserOptions,
        commitsRetrieverOptions: {
          ...commitsRetrieverOptions,
          cwd: directoryPath,
          from: tagPrevious ?? null,
          to: tagCurrent,
          onError,
        },
        tagRetrieverOptions,
        onError,
      });

      try {
        await changelogWriter.writeChangelog(
          directoryPath,
          versionCurrent,
          releaseType,
          validatedCommitsIterator,
          { date },
        );
      } catch (err) {
        onError?.(
          `Failed to generate changelog entry for version ${tagCurrent}`,
          { cause: err },
        );
      }
    },
    Promise.resolve(),
  );
}
