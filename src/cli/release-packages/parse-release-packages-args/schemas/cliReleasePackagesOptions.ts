import type { z } from 'zod';

import { baseReleaseOptions } from '../../../../release/release/schemas/releaseOptions.js';

export const cliReleasePackagesOptions = baseReleaseOptions.omit({
  changelogWriterOptions: true,
  releaseType: true,
  releaseVersion: true,
});
export type CliReleasePackagesOptions = z.infer<typeof cliReleasePackagesOptions>;
