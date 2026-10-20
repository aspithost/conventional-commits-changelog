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
 * Generates a changelog from the full git history of a project that has no
 * changelog yet. The function writes one entry for every semver tag
 * (`1.2.3` or `v1.2.3`) on the default branch, newest first, and leaves
 * `package.json` and the README untouched.
 *
 * Run this function once when you adopt the library. Use `release`
 * for every release after that.
 *
 * @param options - {@link GenerateChangelogOptions}.
 * @returns A promise that resolves when the function writes the changelog.
 *
 * @remarks
 * The function throws when the repository has no version tags or when the
 * changelog already contains version entries. Commits after the latest tag
 * stay out of the changelog; the next `release` call picks them up.
 * With `isDryRun`, the function logs the versions it would write and changes nothing.
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
