import { parse, inc, SemVer } from 'semver';
import { Bumper, type BumperRecommendation} from 'conventional-recommended-bump';

import type { CommitSchema } from '@/schemas/commit.js';
import { execSync } from 'child_process';

export class VersionManger<T extends string, U extends string> {
  private readonly bumperPreset: string;

  constructor(bumperPreset: string = 'conventional-changelog-conventionalcommits') {
    this.bumperPreset = bumperPreset;
  }

  // write to multiple files if specified. Always include package and package-lock
  // optional: README, 
  bumpNpmVersion() {
    try {
      const res = execSync('npm version patch --no-git-tag-version', { encoding: 'utf-8' });
      console.log('RES', res);
    } catch (err) {
      console.error('Error bumping version');
      throw err;
    }
  }

  writeToChangelog() {

  }

  async getRecommendBump(): Promise<BumperRecommendation['releaseType'] | null> {
    const bumper = this.createBumper();
    // this.setBumperCommits(bumper);
    const recommendedBump = await bumper.bump();
    if (!('releaseType' in recommendedBump)) {
      return null;
    }
    return recommendedBump.releaseType;
  }

  private createBumper() {
    return new Bumper().loadPreset(this.bumperPreset);
  }

  private setBumperCommits(bumper: Bumper, commits: CommitSchema<T, U>[]): void {
    bumper.commits(commits);
  }

  // Necessary or can I use npm version
  // private parseVersion(version: string): SemVer {
  //   const currentVersion = parse(version);
  //   if (!currentVersion) {
  //     throw new Error(`Could not parse current version for scope: ${scope}`);
  //   }
  //   return currentVersion;
  // }

  // private readCurrentVersion(): string {
  //   // to-do: read function from package
  // }
}