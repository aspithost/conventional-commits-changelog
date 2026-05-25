import { bumpNpmVersion } from './utils/bumpNpmVersion.js';
import { updateReadme } from './utils/updateReadme.js';

import type { ReleaseType } from '@/types/index.js';

export interface BumpVersionOptions {
  isDryRun?: boolean;
  isUpdateReadme?: boolean;
}

// to-do: JSDoc signature for documentation
export function bumpVersion(
  workingDirectory: string,
  releaseType: ReleaseType,
  {
    isUpdateReadme = true,
  }: Pick<BumpVersionOptions, 'isUpdateReadme'> = {},
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
