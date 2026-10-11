import { bumpNpmVersion } from './utils/bumpNpmVersion.js';
import { updateReadme } from './utils/updateReadme.js';

import type { ReleaseType } from '@/release/types/release.js';

/**
 * Options for bumping a package version.
 */
export interface BumpVersionOptions {
  /** Whether to update the version references in the README after the bump. */
  isUpdateReadme?: boolean;
}

export function bumpVersion(
  workingDirectory: string,
  releaseType: ReleaseType,
  {
    isUpdateReadme = true,
  }: BumpVersionOptions = {},
): string {
  if (!workingDirectory) {
    throw new Error('You need to provide the path to a working directory with a package.json.');
  }
  const newVersion = bumpNpmVersion(workingDirectory, releaseType);
  if (isUpdateReadme) {
    updateReadme(workingDirectory, newVersion);
  }
  return newVersion;
}
