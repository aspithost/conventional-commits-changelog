import { execFileSync } from 'node:child_process';

import { logError, type ErrorHandler } from '@/utils/error/logError.js';
import type { OnError } from '@/utils/error/types/error.js';

export const COMMIT_FORMAT = '%H||%B%x00'; // Note: exported for unit test purposes only

interface RawCommit {
  commit: string;
  hash: string;
}
export type RawCommits = Iterable<RawCommit>;
export interface CommitsRetrieverOptions {
  commitFormat?: string;
  cwd?: string;
  from?: string;
  to?: string;
  releaseBranch?: string;
}

export class CommitsRetriever {
  readonly #commitFormat: string;
  readonly #cwd: string;
  readonly #from?: string;
  readonly #to: string;
  readonly #releaseBranch: string;
  readonly #onError: ErrorHandler;

  constructor({
    commitFormat = COMMIT_FORMAT,
    cwd = process.cwd(),
    from,
    to = 'HEAD',
    releaseBranch = 'refs/remotes/origin/HEAD',
    onError = logError,
  }: CommitsRetrieverOptions & OnError = {}) {
    for (const [name, value] of Object.entries({ from, to, releaseBranch })) {
      this.#validateInput(name, value);
    }

    this.#commitFormat = commitFormat;
    this.#cwd = cwd;
    this.#from = from;
    this.#to = to;
    this.#releaseBranch = releaseBranch;
    this.#onError = onError;
  }

  *getRawCommits(): RawCommits {
    try {
      const rawCommitsString = this.#getRawCommitsString();
      for (const rawCommit of rawCommitsString.split('\x00')) {
        const rawCommitTrimmed = rawCommit.trim();
        if (!rawCommitTrimmed) continue;
        const [hash, ...rest] = rawCommitTrimmed.split('||');
        yield { hash, commit: rest.join('||').trim() };
      }
    } catch (err) {
      this.#onError('Could not retrieve commits.', err);
      return;
    }
  }

  get #commitRange(): string {
    const from = this.#from ?? this.#getLatestTag();
    return from ? `${from}..${this.#to}` : this.#to;
  }

  #getRawCommitsString(): string {
    return this.#_execFileSync('git', [
      'log',
      `--pretty=format:${this.#commitFormat}`,
      this.#commitRange,
    ]);
  }

  #getLatestTag(): string | null {
    try {
      const defaultBranch = this.#getDefaultBranch();
      return this.#_execFileSync('git', [
        'describe',
        '--tags',
        '--abbrev=0',
        defaultBranch,
      ]);
    } catch (err) {
      this.#onError('No tags found.', err);
      return null;
    }
  }

  #getDefaultBranch(): string {
    try {
      // Return type: 'refs/remotes/origin/HEAD'
      return this.#_execFileSync('git', ['symbolic-ref', this.#releaseBranch]);
    } catch (err) {
      this.#onError('No remote HEAD reference found. Now defaults to origin/main.', err);
      // Default fallback
      return 'origin/main';
    }
  }

  #_execFileSync(command: string, args: string[]): string {
    return execFileSync(command, args, {
      encoding: 'utf-8',
      cwd: this.#cwd,
      maxBuffer: 1024 * 1024 * 10, // 10 MB
    }).trim();
  }

  #validateInput(name: string, value?: string) {
    if (value?.startsWith('-')) {
      throw new Error(`Invalid ${name} "${value}": refs may not start with '-'`);
    }
  }
}
