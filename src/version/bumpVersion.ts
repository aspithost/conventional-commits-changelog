import type { ReleaseType } from '../release/types/release.js';

import { bumpNpmVersion } from './utils/bumpNpmVersion.js';
import { updateReadme } from './utils/updateReadme.js';

import type { OnError } from '@/utils/error/types/error.js';

export interface BumpVersionOptions extends OnError {
  /**
   * Whether to update the version references in the README after the bump.
   *
   * @defaultValue `true`
   */
  isUpdateReadme?: boolean;
}

export function bumpVersion(
  workingDirectory: string,
  releaseType: ReleaseType,
  {
    isUpdateReadme = true,
    onError,
  }: BumpVersionOptions = {},
): string {
  if (!workingDirectory) {
    throw new Error('You need to provide the path to a working directory with a package.json.');
  }
  const newVersion = bumpNpmVersion(workingDirectory, releaseType);
  if (isUpdateReadme) {
    updateReadme(workingDirectory, newVersion, { onError });
  }
  return newVersion;
}
