#!/usr/bin/env node
import { releasePackages } from '../../release/release-packages/releasePackages.js';

import {
  parseReleasePackagesArgs,
} from './parse-release-packages-args/parseReleasePackagesArgs.js';

export async function cliReleasePackages(): Promise<void> {
  try {
    await releasePackages(parseReleasePackagesArgs());
  } catch (err) {
    if (err instanceof Error) {
      console.error('Release packages failed:', err.message);
      console.error(err.stack);
    } else {
      console.error('Release packages failed');
    }
    process.exitCode = 1;
  }
}

await cliReleasePackages();
