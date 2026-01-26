import { execSync } from 'node:child_process';

export type RawCommits = Generator<string, void, unknown>;

export class CommitsRetriever {
  private readonly from: string | undefined;
  private readonly to: string;
  private readonly releaseBranch: string;

  constructor({
    from = undefined,
    to = 'HEAD',
    releaseBranch = 'refs/remotes/origin/HEAD',
  }: {
    from?: string;
    to?: string;
    releaseBranch?: string;
  } = {}) {
    this.from = from;
    this.to = to;
    this.releaseBranch = releaseBranch;
  }

  *getRawCommits(): RawCommits {
    const commitsString = this.getRawCommitsString();
    for (const rawCommit of commitsString.split('\x00')) {
      const commit = rawCommit.trim();
      if (commit) {
        yield commit;
      }
    }
  }

  private get commitFormat() {
    return '--pretty=format:"%H %B%x00"';
  }

  private get commitRange() {
    const from = this.from ?? this.getLatestTag();
    return from ? `${from}..${this.to}` : this.to;
  }

  private getRawCommitsString(): string {
    return this._execSync(`git log --no-abbrev-commit ${this.commitFormat} ${this.commitRange}`);
  }

  private getDefaultBranch(): string {
    try {
      // Return type: 'origin/main'
      return this._execSync(`git symbolic-ref ${this.releaseBranch}`);
    } catch {
      console.log('No remote HEAD reference found. Now defaults to origin/main.');
      // Default fallback
      return this.releaseBranch.replace('refs/remotes/', '');
    }
  }

  private getLatestTag() {
    try {
      const defaultBranch = this.getDefaultBranch();
      return this._execSync(`git describe --tags --abbrev=0 ${defaultBranch}`);
    } catch {
      console.log('No tags found.');
      return null;
    }
  }

  private _execSync(command: string): string {
    return execSync(command, { encoding: 'utf-8' }).trim();
  }
}
