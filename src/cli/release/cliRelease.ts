#!/usr/bin/env node
import { release } from '../../release/release/release.js';

import { parseReleaseArgs } from './parse-release-args/parseReleaseArgs.js';

export async function cliRelease(): Promise<void> {
  try {
    await release(parseReleaseArgs());
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Release failed:', err.message);
      console.error(err.stack);
    } else {
      console.error('Release failed');
    }
    process.exitCode = 1;
  }
}

await cliRelease();
