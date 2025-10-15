import type { ParserStreamOptions } from 'conventional-commits-parser';
import { parse, inc, SemVer } from 'semver';
import { Bumper, type BumperRecommendationResult } from 'conventional-recommended-bump';

import { ScopedCommitsReader } from '@/commits/scoped-commits-reader/scopedCommitsReader.js';

import type { GetCommitsOptions } from '@/commits/commits-reader/commitsReader.js';
import type { CommitSchema } from '@/schemas/commit.js';

export class VersionManger<T extends string, U extends string> extends ScopedCommitsReader<T, U> {
  private readonly bumperPreset: string;

  constructor(
    allowedScopes?: readonly T[],
    allowedTypes?: readonly U[],
    {
      getCommitsOptions,
      parserStreamOptions,
      directoryName,
      bumperPreset = 'conventional-changelog-conventionalcommits',
    }: {
      getCommitsOptions?: GetCommitsOptions;
      parserStreamOptions?: ParserStreamOptions;
      directoryName?: string;
      bumperPreset?: string,
    } = {},
  ) {
    super(
      allowedScopes,
      allowedTypes,
      {
        getCommitsOptions,
        parserStreamOptions,
        directoryName,
      }
    );
    this.bumperPreset = bumperPreset;
  }

  bumpVersions() {

  }

  writeToChangelogs() {

  }

  bumpVersionsByScope(scope: T) {
    const currentVersion = this.parseVersion(this.readCurrentVersion(scope), scope);
    const recommendedBump = this.getRecommendBumpByScope(scope);
    // to-do: read and bump files with version
  }
  
  writeToChangelogByScope() {

  }

  async getRecommendBumpByScope(scope: T): Promise<BumperRecommendationResult> {
    const bumper = this.createBumper();
    this.setBumperCommits(bumper, this.getCommitsByScope(scope) ?? []);
    return await bumper.bump();
  }

  private createBumper() {
    return new Bumper().loadPreset(this.bumperPreset);
  }

  private setBumperCommits(bumper: Bumper, commits: CommitSchema<T, U>[]): void {
    bumper.commits(commits);
  }

  private parseVersion(version: string, scope: T): SemVer {
    const currentVersion = parse(version);
    if (!currentVersion) {
      throw new Error(`Could not parse current version for scope: ${scope}`);
    }
    return currentVersion;
  }

  private readCurrentVersion(scope: T): string {
    // to-do: read function from package
  }
}