import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ValidatedCommits } from '@/commits/validator/CommitsValidator.js';

import type { ReleaseType } from '@/types/index.js';

export class VersionBumper<T extends string, U extends string> {
  bumpVersion(
    folderPath: string,
    commits: ValidatedCommits<T, U>,
    {
      bumpReadme = true,
      dryRun = false,
    }: {
      bumpReadme?: boolean;
      dryRun?: boolean;
    } = {},
  ): { version: string; releaseType: ReleaseType } | undefined {
    const releaseType = this.determineReleaseType(commits);
    if (!releaseType) {
      return;
    }
    if (dryRun) {
      console.log(`[dry-run] Would bump ${folderPath} with release type ${releaseType}.`);
      return;
    }

    const newVersion = this.bumpNpmVersion(folderPath, releaseType);
    if (bumpReadme) {
      this.bumpReadme(folderPath, newVersion);
    }
    return { version: newVersion, releaseType };
  }

  private determineReleaseType(
    commits: ValidatedCommits<T, U>,
  ): ReleaseType | null {
    let releaseType: ReleaseType | null = null;

    for (const commit of commits) {
      // Breaking change = major (highest priority, can return early)
      const hasBreakingChange = commit.notes.some(note =>
        note.title === 'BREAKING CHANGE' || note.title === 'BREAKING-CHANGE'
      );
      if (hasBreakingChange) {
        return 'major';
      }

      // Feature = minor
      if (commit.type === 'feat') {
        releaseType = 'minor';
      }

      // Fix = patch (only if not already minor)
      if (commit.type === 'fix' && releaseType !== 'minor') {
        releaseType = 'patch';
      }
    }

    return releaseType;
  }

  private bumpNpmVersion(
    folderPath: string,
    releaseType: ReleaseType,
  ): string {
    try {
      const bumpedVersion = execSync(`npm version ${releaseType} --no-git-tag-version`, {
        cwd: folderPath,
        encoding: 'utf-8',
      })
        .trim()
        .replace(/^v/, '');
      return bumpedVersion;
    } catch (err) {
      console.error(`Error bumping version in folder path: ${folderPath}`);
      throw err;
    }
  }

  private bumpReadme(folderPath: string, newVersion: string): void {
    try {
      const readmePath = join(folderPath, 'README.md');
      const readmeContent = readFileSync(readmePath, 'utf-8');
      writeFileSync(
        readmePath,
        readmeContent.replace(/\d+\.\d+\.\d+/m, newVersion),
        'utf-8',
      );
    } catch (err) {
      console.error(`Error bumping README.md in folder: ${folderPath}`);
      throw err;
    }
  }
}
