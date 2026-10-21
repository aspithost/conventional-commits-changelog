import { logError } from '../utils/error/logError.js';

import type { GenerateChangelogOptions } from './types/generateChangelog.js';
import {
  generateChangelogVersioned,
}from './utils/generate-changelog-versioned/generateChangelogVersioned.js';
import { type TagEntry, formatTagEntries } from './utils/tags/formatTagEntries.js';
import { getVersionTags } from './utils/tags/getVersionTags.js';
import {
  parseSemverVersionFromTag,
} from './utils/tags/parse-semver-version-from-tag/parseSemverVersionFromTag.js';

const DEFAULT_REMOTE_SYMBOLIC_REF = 'refs/remotes/origin/HEAD';

/**
 * Generates changelog entries for version tags merged into the configured branch.
 *
 * Use this function to add existing release history. Use `release` for
 * subsequent releases.
 *
 * @param options - Options for changelog generation.
 * @returns A promise that resolves when changelog generation completes.
 *
 * @remarks
 * The function throws when no valid version tags exist. With `isDryRun`, it
 * logs the entries without writing to the changelog.
 *
 * @example
 * ```ts
 * await generateChangelog({ isDryRun: true });
 * ```
 */
export async function generateChangelog({
  changelogWriterOptions,
  commitsParserOptions,
  commitsRetrieverOptions,
  commitsValidatorOptions,
  directoryPath = process.cwd(),
  isDryRun = false,
  onError = logError,
}: GenerateChangelogOptions<string, string> = {}): Promise<void> {
  const tags = getVersionTags({
    cwd: directoryPath,
    remoteSymbolicRef: commitsRetrieverOptions?.remoteSymbolicRef ?? DEFAULT_REMOTE_SYMBOLIC_REF,
  });
  if (tags.length === 0) {
    throw new Error('Did not find valid semantic version tags.');
  }

  const tagEntries: TagEntry[] = formatTagEntries(directoryPath, tags);

  if (isDryRun) {
    for (const { tagCurrent, date } of tagEntries) {
      const version = parseSemverVersionFromTag(tagCurrent);
      console.log(`[dry-run] Would write changelog entry for tag ${version} (${date}).`);
    }
    return;
  }

  await generateChangelogVersioned(
    tagEntries,
    {
      changelogWriterOptions,
      commitsParserOptions,
      commitsRetrieverOptions,
      commitsValidatorOptions,
      directoryPath,
      onError,
    },
  );
}
