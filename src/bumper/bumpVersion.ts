import type { ReleaseType } from '@/types/index.js';

import type { ValidatedCommits } from '@/commits/validator/CommitsValidator.js';

import { bumpNpmVersion } from './utils/bumpNpmVersion.js';
import { determineReleaseType } from './utils/determineReleaseType.js';
import { updateReadme } from './utils/updateReadme.js';

export function bumpVersion(
  scopePath: string,
  commits: ValidatedCommits<string, string>,
  {
    isUpdateReadme = true,
    dryRun = false,
  }: {
    isUpdateReadme?: boolean;
    dryRun?: boolean;
  } = {},
): { version: string; releaseType: ReleaseType } | undefined {
  const releaseType = determineReleaseType(commits);
  if (!releaseType) {
    return;
  }
  if (dryRun) {
    console.log(`[dry-run] Would bump ${scopePath} with release type ${releaseType}.`);
    return;
  }

  const newVersion = bumpNpmVersion(scopePath, releaseType);
  if (isUpdateReadme) {
    updateReadme(scopePath, newVersion);
  }
  return { version: newVersion, releaseType };
}

