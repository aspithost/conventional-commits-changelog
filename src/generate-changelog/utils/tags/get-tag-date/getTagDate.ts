import { execFileSyncWrapper } from '../../../../utils/node/execFileSync.js';

export function getTagDate(
  tag: string,
  cwd: string,
): string {
  try {
    return execFileSyncWrapper('git', [
      'log',
      '-1',
      '--format=%cs',
      tag,
    ], cwd);
  } catch (err) {
    throw new Error(`Could not retrieve data for '${tag}'`, { cause: err });
  }
}
