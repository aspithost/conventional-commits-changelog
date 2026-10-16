import { getSortedTags } from './get-sorted-tags/getSortedTags.js';
import { getSymbolicRef } from './get-symbolic-ref/getSymbolicRef.js';

interface GetVersionTagsOptions {
  cwd: string;
  remoteSymbolicRef: string;
}

export function getVersionTags({
  cwd,
  remoteSymbolicRef,
}: GetVersionTagsOptions): string[] {
  const branch = getSymbolicRef(remoteSymbolicRef, cwd);
  return getSortedTags(branch, cwd);
}
