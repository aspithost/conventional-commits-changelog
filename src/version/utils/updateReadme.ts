import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { OnError } from '../../utils/error/types/error.js';

export function updateReadme(
  directoryPath: string,
  newVersion: string,
  {
    onError,
  }: OnError = {},
): void {
  try {
    const readmePath = join(directoryPath, 'README.md');
    const readmeContent = readFileSync(readmePath, 'utf-8');
    writeFileSync(
      readmePath,
      readmeContent.replace(/\d{1,4}\.\d{1,4}\.\d{1,4}/, newVersion),
      'utf-8',
    );
  } catch (err) {
    onError?.(
      `Error bumping README.md in folder: ${directoryPath}. Continuing without updating README.`,
      {
        error: err,
      },
    );
  }
}
