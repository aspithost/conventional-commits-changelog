import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { Bumper } from 'conventional-recommended-bump';

import type { ReleaseType } from '@/types/index.js';
import type { CommitSchema } from '@/schemas/commit.js';

export class VersionManager<T extends string, U extends string> {
  private readonly bumperPreset: string;

  constructor(bumperPreset: string = 'conventional-changelog-conventionalcommits') {
    this.bumperPreset = bumperPreset;
  }

  async bumpVersion(
    folderPath: string,
    commits: CommitSchema<T, U>[],
    {
      bumpReadme = true,
      dryRun = false,
    }: {
      bumpReadme?: boolean;
      dryRun?: boolean;
    } = {},
  ): Promise<{ version: string, releaseType: ReleaseType } | undefined> {
    const releaseType = await this.getRecommendReleaseType(commits);
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

  async getRecommendReleaseType(
    commits: CommitSchema<T, U>[],
  ): Promise<ReleaseType | null> {
    const bumper = this.createBumper();
    this.setBumperCommits(bumper, commits);
    const recommendedBump = await bumper.bump();
    if (!('releaseType' in recommendedBump)) {
      return null;
    }
    return recommendedBump.releaseType;
  }

  private createBumper(): Bumper {
    return new Bumper().loadPreset(this.bumperPreset);
  }

  private setBumperCommits(bumper: Bumper, commits: CommitSchema<T, U>[]): void {
    bumper.commits(commits);
  }
}
