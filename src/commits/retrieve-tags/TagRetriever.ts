import type { ErrorHandler } from '../../utils/error/logError.js';
import type { OnError } from '../../utils/error/types/error.js';
import { execFileSyncWrapper } from '../../utils/node/execFileSync.js';

import { type TagRetrieverOptions, tagRetrieverOptions } from './schemas/tagRetrieverOptions.js';

export const DEFAULT_REMOTE_SYMBOLIC_REF = 'refs/remotes/origin/HEAD';
export const FALLBACK_REMOTE_BRANCH = 'origin/main';

export class TagRetriever {
  readonly #cwd: string;
  readonly #remoteSymbolicRef: string;
  readonly #onError?: ErrorHandler | null;

  constructor({
    cwd,
    remoteSymbolicRef,
    onError,
  }: TagRetrieverOptions & OnError = {}) {
    const validatedOptions = this.#validateConstructorOptions({
      cwd,
      remoteSymbolicRef,
    });
    this.#cwd = validatedOptions.cwd ?? process.cwd();
    this.#remoteSymbolicRef = validatedOptions.remoteSymbolicRef ?? DEFAULT_REMOTE_SYMBOLIC_REF;
    this.#onError = onError;
  }

  getLatestTag(): string | null {
    const defaultRemoteBranch = this.#getDefaultRemoteBranch();
    return this.#getLatestRemoteTag(defaultRemoteBranch);
  }

  #getDefaultRemoteBranch(): string {
    try {
      return this.#execGit(['symbolic-ref', this.#remoteSymbolicRef]);
    } catch (err) {
      this.#onError?.(
        `WARN: No remote symbolic reference found. Defaults to ${FALLBACK_REMOTE_BRANCH}.`,
        err,
      );
      return FALLBACK_REMOTE_BRANCH;
    }
  }

  #getLatestRemoteTag(remoteBranch: string) {
    try {
      return this.#execGit([
        'describe',
        '--tags',
        '--abbrev=0',
        remoteBranch,
      ]);
    } catch (err) {
      this.#onError?.('WARN: no tags found on remote branch.', err);
      return null;
    }
  }

  #execGit(args: string[]): string {
    return execFileSyncWrapper('git', args, this.#cwd);
  }

  #validateConstructorOptions(options: TagRetrieverOptions): TagRetrieverOptions {
    try {
      return tagRetrieverOptions.parse(options);
    } catch (err) {
      throw new Error('Invalid TagRetriever options', { cause: err });
    }
  }
}
