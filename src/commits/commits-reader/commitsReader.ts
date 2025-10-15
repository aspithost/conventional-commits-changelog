import { execSync } from 'node:child_process';

export interface GetCommitsOptions {
  from?: string;
  to?: string;
  includeHash?: boolean;
  delimiter?: string;
  splitDelimiter?: string;
}
export type RawCommits = Generator<string, void, unknown>;

export class CommitsReader {
  readonly from: GetCommitsOptions['from'];
  readonly to: NonNullable<GetCommitsOptions['to']>;
  readonly includeHash: NonNullable<GetCommitsOptions['includeHash']>;
  readonly delimiter: NonNullable<GetCommitsOptions['delimiter']>;
  readonly splitDelimiter: NonNullable<GetCommitsOptions['splitDelimiter']>;

  constructor({
    from,
    to = 'HEAD',
    includeHash = true,
    delimiter = 'x00',
    splitDelimiter = '\x00',
  }: GetCommitsOptions = {}) {
    this.from = from;
    this.to = to;
    this.includeHash = includeHash;
    this.delimiter = delimiter;
    this.splitDelimiter = splitDelimiter;
  }

  private getLatestTag() {
    try {
      return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' });
    } catch {
      console.log('No tags found.');
      return undefined;
    }
  }

  private get range() {
    const from = this.from ?? this.getLatestTag();
    return from ? `${from}..${this.to}` : this.to;
  }

  private get format() {
    return `--format="${this.includeHash ? '%H ' : ''}%B%${this.delimiter}"`;
  }

  private getRawCommitsString(): string {
    const command = `git log --no-abbrev-commit ${this.format} ${this.range}`;
    return execSync(command, { encoding: 'utf-8' }).trim();
  }

  *getRawCommits(): RawCommits {
    try {
      const commitsString = this.getRawCommitsString();
      for (const rawCommit of commitsString.split(this.splitDelimiter)) {
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
}
