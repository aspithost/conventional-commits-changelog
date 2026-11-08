import { parseArgs } from 'node:util';

import type { CliReleaseOptions } from './schemas/cliReleaseOptions.js';
import { validateReleaseArgs } from './utils/validateReleaseArgs.js';

export function parseReleaseArgs(
  argv: string[] = process.argv.slice(2),
): CliReleaseOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      cwd: { type: 'string' },
      'dry-run': {
        type: 'boolean',
        default: false,
      },
      'update-readme': {
        type: 'boolean',
        default: false,
      },
      type: {
        type: 'string',
        short: 't',
      },
      version: {
        type: 'string',
        short: 'v',
      },
    },
    strict: true,
  });

  const {
    cwd: directoryPath,
    'dry-run': isDryRun,
    'update-readme': isUpdateReadme,
    type: releaseType,
    version: releaseVersion,
  } = values;

  const validatedReleaseArgs = validateReleaseArgs({
    directoryPath,
    isDryRun,
    isUpdateReadme,
    releaseType,
    releaseVersion,
  });

  if (releaseType && releaseVersion) {
    throw new Error('Use either --type or --version, not both.');
  }

  return validatedReleaseArgs;
}
