import { execFileSync } from 'node:child_process';

export interface RawCommit {
  hash: string;
  commit: string;
}
export type RawCommits = Iterable<RawCommit>;
export class CommitsRetriever {
  readonly #commitFormat: string;
  readonly #from: string | undefined;
  readonly #to: string;
  readonly #releaseBranch: string;

  constructor({
    commitFormat = '%H||%B%x00',
    from,
    to = 'HEAD',
    releaseBranch = 'refs/remotes/origin/HEAD',
  }: {
    commitFormat?: string;
    from?: string;
    to?: string;
    releaseBranch?: string;
  } = {}) {
    this.#commitFormat = commitFormat;
    this.#from = from;
    this.#to = to;
    this.#releaseBranch = releaseBranch;
  }

  *getRawCommits(): RawCommits {
    try {
      // to-do: do not retrieve empty line last entry
      const rawCommitsString = this.getRawCommitsString();
      for (const rawCommit of rawCommitsString.split('\x00')) {
        const rawCommitTrimmed = rawCommit.trim();
        if (!rawCommitTrimmed) continue;
        const [hash, ...rest] = rawCommitTrimmed.split('||');
        yield { hash, commit: rest.join('||').trim() };
      }
    } catch {
      console.error('Could not retrieve commits.');
      return;
    }
  }

  private get commitRange() {
    const from = this.#from ?? this.getLatestTag();
    return from ? `${from}..${this.#to}` : this.#to;
  }

  private getRawCommitsString(): string {
    // return dummyCommitString;
    return this._execFileSync('git', [
      'log',
      '--no-abbrev-commit',
      `--pretty=format:${this.#commitFormat}`,
      this.commitRange,
    ]);
  }

  private getDefaultBranch(): string {
    try {
      // Return type: 'origin/main'
      return this._execFileSync('git', ['symbolic-ref', this.#releaseBranch]);
    } catch {
      console.error('No remote HEAD reference found. Now defaults to origin/main.');
      // Default fallback
      return this.#releaseBranch.replace('refs/remotes/', '');
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
      console.error('No tags found.');
      return null;
    }
  }

  private _execFileSync(command: string, args: string[]): string {
    return execFileSync(command, args, { encoding: 'utf-8' }).trim();
  }
}
