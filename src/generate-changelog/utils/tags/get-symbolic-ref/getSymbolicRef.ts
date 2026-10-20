import { _execFileSync } from '../../../../utils/node/execFileSync.js';

export function getSymbolicRef(
  symbolicRef: string,
  cwd: string,
) {
  try {
    return _execFileSync('git', ['symbolic-ref', symbolicRef], cwd);
  } catch (err) {
    throw new Error(`Could not retrieve symbolic ref with value: ${symbolicRef}`, { cause: err });
  }
}
