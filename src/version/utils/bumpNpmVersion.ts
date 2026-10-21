import { execSync } from 'node:child_process';

import type { ReleaseType } from '../../release/release/types/release.js';

export function bumpNpmVersion(
  directoryPath: string,
  releaseType: ReleaseType,
): string {
  try {
    const bumpedVersion = execSync(
      `npm version ${releaseType} --no-git-tag-version`,
      {
        cwd: directoryPath,
        encoding: 'utf-8',
      },
    )
      .trim()
      .replace(/^v/, '');
    return bumpedVersion;
  } catch (err) {
    throw new Error(`Error bumping version in folder path: ${directoryPath}`, { cause: err });
  }
}
