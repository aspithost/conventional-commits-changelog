import type { ErrorHandler } from '../../utils/error/logError.js';
import type { OnError } from '../../utils/error/types/error.js';
import { _execFileSync } from '../../utils/node/execFileSync.js';

import {
  type CommitsRetrieverOptions,
  commitsRetrieverOptions,
} from './schemas/commitsRetrieverOptions.js';

export const COMMIT_FORMAT = '%H||%B%x00'; // Note: exported for unit test purposes only
export const DEFAULT_REMOTE_SYMBOLIC_REF = 'refs/remotes/origin/HEAD';
const FALLBACK_REMOTE_BRANCH = 'origin/main';

interface RawCommit {
  /** The commit message body. */
  commit: string;
  /** The full hash of the commit. */
  hash: string;
}

export type RawCommits = Iterable<RawCommit>;

export class CommitsRetriever {
  readonly #commitFormat: string;
  readonly #cwd: string;
  readonly #from?: string | null;
  readonly #to: string;
  readonly #remoteSymbolicRef: string;
  readonly #onError?: ErrorHandler | null;

  constructor({
    commitFormat = COMMIT_FORMAT,
    cwd = process.cwd(),
    from,
    to = 'HEAD',
    remoteSymbolicRef = DEFAULT_REMOTE_SYMBOLIC_REF,
    onError,
  }: CommitsRetrieverOptions & OnError = {}) {
    this.#validateConstructorOptions({
      commitFormat,
      cwd,
      from,
      to,
      remoteSymbolicRef,
    });

    this.#commitFormat = commitFormat;
    this.#cwd = cwd;
    this.#from = from;
    this.#to = to;
    this.#remoteSymbolicRef = remoteSymbolicRef;
    this.#onError = onError;
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
    if (this.#from !== null) {
      const latestTag = this.#getLatestTag();
      if (latestTag) return `${latestTag}..${this.#to}`;
    }
    return this.#to;
  }

  #getRawCommitsString(): string {
    return this.#execGit([
      'log',
      `--pretty=format:${this.#commitFormat}`,
      this.#commitRange,
    ]);
  }

  #getLatestTag(): string | null {
    try {
      const defaultRemoteBranch = this.#getDefaultRemoteBranch();
      return this.#execGit([
        'describe',
        '--tags',
        '--abbrev=0',
        defaultRemoteBranch,
      ]);
    } catch (err) {
      this.#onError?.('WARN: no tags found on remote branch.', err);
      return null;
    }
  }

  #getDefaultRemoteBranch(): string {
    try {
      return _execFileSync('git', ['symbolic-ref', this.#remoteSymbolicRef], this.#cwd);
    } catch (err) {
      this.#onError?.(
        `WARN: No remote symbolic reference found. Defaults to ${FALLBACK_REMOTE_BRANCH}.`,
        err,
      );
      return FALLBACK_REMOTE_BRANCH;
    }
  }

  #execGit(args: string[]): string {
    return _execFileSync('git', args, this.#cwd);
  }

  #validateConstructorOptions(options: CommitsRetrieverOptions) {
    try {
      return commitsRetrieverOptions.parse(options);
    } catch (err) {
      throw new Error('Invalid commits retriever options.', { cause: err });
    }
  }
}
