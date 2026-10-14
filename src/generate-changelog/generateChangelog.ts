import { logError } from '../utils/error/logError.js';

import type { GenerateChangelogOptions } from './types/generateChangelog.js';
import { generateChangelogVersioned } from './utils/generateChangelogVersioned.js';
import { getVersionTags } from './utils/getVersionTags.js';
import { getTagDate } from './utils/git/getTagDate.js';
import { handleGenerateChangelogErrors } from './utils/handleGenerateChangelogErrors.js';

const DEFAULT_REMOTE_SYMBOLIC_REF = 'refs/remotes/origin/HEAD';

export interface TagEntry {
  tag: string;
  previousTag?: string;
  date: string;
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

  const tagEntries: TagEntry[] = tags.map((tag, index) => ({
    tag,
    previousTag: index === 0 ? undefined : tags[index - 1],
    date: getTagDate(tag, directoryPath),
  }));

  if (isDryRun) {
    for (const { tag, date } of tagEntries) {
      console.log(`[dry-run] Would write changelog entry for ${tag} (${date}).`);
    }
    return;
  }

  const generateChangelogVersionedResults = await generateChangelogVersioned(
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

  if (onError) {
    handleGenerateChangelogErrors(
      generateChangelogVersionedResults,
      onError,
    );
  }
}
