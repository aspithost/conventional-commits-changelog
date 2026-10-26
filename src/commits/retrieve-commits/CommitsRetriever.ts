import type { OnError } from '../../utils/error/types/error.js';
import { execFileSyncWrapper } from '../../utils/node/execFileSync.js';

import {
  type CommitsRetrieverOptions as _CommitsRetrieverOptions,
  commitsRetrieverOptions,
} from './schemas/commitsRetrieverOptions.js';

export const COMMIT_FORMAT = '%H||%B%x00'; // Note: exported for unit test purposes only

interface RawCommit {
  /** The commit message body. */
  commit: string;
  /** The full hash of the commit. */
  hash: string;
}

export type CommitsRetrieverOptions = _CommitsRetrieverOptions & OnError;

export type RawCommits = Iterable<RawCommit>;

export class CommitsRetriever {
  readonly #commitFormat: string;
  readonly #cwd: string;
  readonly #from?: string | null;
  readonly #to: string;

  constructor({
    commitFormat,
    cwd,
    from,
    to,
  }: CommitsRetrieverOptions = {}) {
    const validatedOptions = this.#validateConstructorOptions({
      commitFormat,
      cwd,
      from,
      to,
    });

    this.#commitFormat = validatedOptions.commitFormat ?? COMMIT_FORMAT;
    this.#cwd = validatedOptions.cwd ?? process.cwd();
    this.#from = validatedOptions.from;
    this.#to = validatedOptions.to ?? 'HEAD';
  }

  *getRawCommits(): RawCommits {
    try {
      const rawCommitsString = this.#getRawCommitsString();
      for (const rawCommit of rawCommitsString.split('\x00')) {
        const rawCommitTrimmed = rawCommit.trim();
        if (!rawCommitTrimmed) continue;
        const [hash, ...rest] = rawCommitTrimmed.split('||');
        yield {
          hash,
          commit: rest.join('||').trim(),
        };
      }
    } catch (err) {
      throw new Error('Could not retrieve commits.', { cause: err });
    }
  }

  get #commitRange(): string {
    if (this.#from) return `${this.#from}..${this.#to}`;
    return this.#to;
  }

  #getRawCommitsString(): string {
    return execFileSyncWrapper('git', [
      'log',
      `--pretty=format:${this.#commitFormat}`,
      this.#commitRange,
    ], this.#cwd);
  }

  #validateConstructorOptions(options: CommitsRetrieverOptions): CommitsRetrieverOptions {
    try {
      return commitsRetrieverOptions.parse(options);
    } catch (err) {
      throw new Error('Invalid CommitsRetriever options.', { cause: err });
    }
  }
}
