import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function updateReadme(scopePath: string, newVersion: string): void {
  try {
    const readmePath = join(scopePath, 'README.md');
    const readmeContent = readFileSync(readmePath, 'utf-8');
    writeFileSync(
      readmePath,
      readmeContent.replace(/\d+\.\d+\.\d+/m, newVersion),
      'utf-8',
    );
  } catch (err) {
    console.error(`Error bumping README.md in folder: ${scopePath}`);
    throw err;
  }
}
