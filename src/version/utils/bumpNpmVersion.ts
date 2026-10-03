import { execSync } from 'node:child_process';

import type { ReleaseType } from '@/release/types/release.js';
import { type ErrorHandler, logError } from '@/utils/error/logError.js';

export function bumpNpmVersion(
  directoryPath: string,
  releaseType: ReleaseType,
  {
    onError = logError,
  }: {
    onError?: ErrorHandler;
  } = {},
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
    onError(`Error bumping version in folder path: ${directoryPath}`, {
      error: err,
    });
    throw err;
  }
}
