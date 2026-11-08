import { parseArgs } from 'node:util';

import type { CliReleasePackagesOptions } from './schemas/cliReleasePackagesOptions.js';
import { validateReleasePackagesArgs } from './utils/validateReleasePackagesArgs.js';

export function parseReleasePackagesArgs(
  argv: string[] = process.argv.slice(2),
): CliReleasePackagesOptions {
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
    },
    strict: true,
  });

  const {
    cwd: directoryPath,
    'dry-run': isDryRun,
    'update-readme': isUpdateReadme,
  } = values;

  return validateReleasePackagesArgs({
    directoryPath,
    isDryRun,
    isUpdateReadme,
  });
}
