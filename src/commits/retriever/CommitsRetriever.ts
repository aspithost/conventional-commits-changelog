import { execFileSync } from 'node:child_process';

export type RawCommits = Generator<string, void, unknown>;

export class CommitsRetriever {
  private readonly commitFormat: string;
  private readonly from: string | undefined;
  private readonly to: string;
  private readonly releaseBranch: string;

  constructor({
    commitFormat = '%H %B%x00',
    from = undefined,
    to = 'HEAD',
    releaseBranch = 'refs/remotes/origin/HEAD',
  }: {
    commitFormat?: string;
    from?: string;
    to?: string;
    releaseBranch?: string;
  } = {}) {
    this.commitFormat = commitFormat;
    this.from = from;
    this.to = to;
    this.releaseBranch = releaseBranch;
  }

  *getRawCommits(): RawCommits {
    try {
      const commitsString = this.getRawCommitsString();
      for (const rawCommit of commitsString.split('\x00')) {
        const commit = rawCommit.trim();
        if (commit) {
          yield commit;
        }
      }
    } catch {
      console.error('Could not retrieve commits.');
      return;
    }
  }

  private get commitRange() {
    const from = this.from ?? this.getLatestTag();
    return from ? `${from}..${this.to}` : this.to;
  }

  private getRawCommitsString(): string {
    return this._execFileSync('git', [
      'log',
      '--no-abbrev-commit',
      `--pretty=format:${this.commitFormat}`,
      this.commitRange,
    ]);
  }

  private getDefaultBranch(): string {
    try {
      // Return type: 'origin/main'
      return this._execFileSync('git', ['symbolic-ref', this.releaseBranch]);
    } catch {
      console.log('No remote HEAD reference found. Now defaults to origin/main.');
      // Default fallback
      return this.releaseBranch.replace('refs/remotes/', '');
    }
  }

  private getLatestTag() {
    try {
      const defaultBranch = this.getDefaultBranch();
      return this._execFileSync('git', [
        'describe',
        '--tags',
        '--abbrev=0',
        defaultBranch,
      ]);
    } catch {
      console.log('No tags found.');
      return null;
    }
  }

  private _execFileSync(command: string, args: string[]): string {
    return execFileSync(command, args, { encoding: 'utf-8' }).trim();
  }
}
