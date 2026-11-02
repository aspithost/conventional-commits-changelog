import { type CliReleaseOptions, cliReleaseOptions } from '../schemas/cliReleaseOptions.js';

export function validateReleaseArgs(cliReleaseArgs: unknown): CliReleaseOptions {
  try {
    return cliReleaseOptions.parse(cliReleaseArgs);
  } catch (err) {
    throw new Error('Validation error: invalid release arguments', { cause: err });
  }
}
