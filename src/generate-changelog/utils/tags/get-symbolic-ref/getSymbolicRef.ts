import { execFileSyncWrapper } from '../../../../utils/node/execFileSync.js';

export function getSymbolicRef(
  symbolicRef: string,
  cwd: string,
) {
  try {
    return execFileSyncWrapper('git', ['symbolic-ref', symbolicRef], cwd);
  } catch (err) {
    throw new Error(`Could not retrieve symbolic ref with value: ${symbolicRef}`, { cause: err });
  }
}
