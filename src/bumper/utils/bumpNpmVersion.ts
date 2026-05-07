import { execSync } from 'node:child_process';

import type { ReleaseType } from '@/types/index.js';

export function bumpNpmVersion(scopePath: string, releaseType: ReleaseType): string {
  try {
    const bumpedVersion = execSync(
      `npm version ${releaseType} --no-git-tag-version`,
      {
        cwd: scopePath,
        encoding: 'utf-8',
      },
    )
      .trim()
      .replace(/^v/, '');
    return bumpedVersion;
  } catch (err) {
    console.error(`Error bumping version in folder path: ${scopePath}`);
    throw err;
  }
}
