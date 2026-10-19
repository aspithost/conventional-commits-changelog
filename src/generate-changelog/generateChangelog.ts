import { logError } from '../utils/error/logError.js';

import type { GenerateChangelogOptions } from './types/generateChangelog.js';
import {
  generateChangelogVersioned,
}from './utils/generate-changelog-versioned/generateChangelogVersioned.js';
import { getTagDate } from './utils/get-tag-date/getTagDate.js';
import { getVersionTags } from './utils/get-version-tags/getVersionTags.js';

const DEFAULT_REMOTE_SYMBOLIC_REF = 'refs/remotes/origin/HEAD';

export interface TagEntry {
  date: string;
  previousVersion?: string;
  targetVersion: string;
}

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

  const tagEntries: TagEntry[] = tags.map((targetVersion, index) => ({
    targetVersion,
    previousVersion: index === tags.length - 1 ? undefined : tags[index + 1],
    date: getTagDate(targetVersion, directoryPath),
  }));

  if (isDryRun) {
    for (const { targetVersion, date } of tagEntries) {
      console.log(`[dry-run] Would write changelog entry for version v${targetVersion} (${date}).`);
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
