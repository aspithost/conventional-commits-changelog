import { z } from 'zod';

export const releaseType = z.enum([
  'major',
  'minor',
  'patch',
]);
export type ReleaseType = z.infer<typeof releaseType>;

export const releaseVersion = z.string().regex(
  /^(\d+)\.(\d+)\.(\d+)(?:-(\S+))?$/,
  'Invalid semantic version',
);
export type ReleaseVersion = z.infer<typeof releaseVersion>;
