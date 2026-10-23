import { type BaseReleaseOptions, baseReleaseOptions } from '../schemas/releaseOptions.js';

export function validateReleaseInput(_baseReleaseOptions: BaseReleaseOptions): void {
  try {
    baseReleaseOptions.parse(_baseReleaseOptions);
  } catch (err) {
    throw new Error('Validation error: invalid release options', { cause: err });
  }
}
