import { execSync } from 'node:child_process';

export type RawCommits = Generator<string, void, unknown>;

export class CommitsRetriever {
  private readonly from: string | undefined;
  private readonly to: string;

  constructor({
    from = undefined,
    to = 'HEAD',
  }: {
    from?: string;
    to?: string;
  } = {}) {
    this.from = from;
    this.to = to;
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

  private get commitFormat() {
    return '--commitFormat="%H %B%x00';
  }

  private get commitRange() {
    const from = this.from ?? this.getLatestTag();
    return from ? `${from}..${this.to}` : this.to;
  }

  private getRawCommitsString(): string {
    const command = `git log --no-abbrev-commit ${this.commitFormat} ${this.commitRange}`;
    return execSync(command, { encoding: 'utf-8' }).trim();
  }

  private getLatestTag() {
    try {
      return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' });
    } catch {
      console.log('No tags found.');
      return null;
    }
  }
}