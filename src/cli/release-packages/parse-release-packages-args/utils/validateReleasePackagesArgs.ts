import {
  type CliReleasePackagesOptions,
  cliReleasePackagesOptions,
} from '../schemas/cliReleasePackagesOptions.js';

export function validateReleasePackagesArgs(cliReleaseArgs: unknown): CliReleasePackagesOptions {
  try {
    return cliReleasePackagesOptions.parse(cliReleaseArgs);
  } catch (err) {
    throw new Error('Validation error: invalid release packagesarguments', { cause: err });
  }
}
