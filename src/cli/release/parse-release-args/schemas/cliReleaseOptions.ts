import type { z } from 'zod';

import { baseReleaseOptions } from '../../../../release/release/schemas/releaseOptions.js';

export const cliReleaseOptions = baseReleaseOptions.omit({ changelogWriterOptions: true });
export type CliReleaseOptions = z.infer<typeof cliReleaseOptions>;
