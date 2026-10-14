
import { getSortedTags } from './git/getSortedTags.js';
import { getSymbolicRef } from './git/getSymbolicRef.js';

// to-do: review if used
interface GetVersionTagsOptions {
  /**
   * Current working directory.
   */
  cwd: string;
  /**
   * Symbolic ref that points to the default remote branch.
   */
  remoteSymbolicRef: string;
}

export function getVersionTags({
  cwd,
  remoteSymbolicRef,
}: GetVersionTagsOptions): string[] {
  const branch = getSymbolicRef(remoteSymbolicRef, cwd);
  return getSortedTags(branch, cwd);
}
