import { z } from 'zod';

const remoteRepositoryInformation = z.object({
  /** The remote host URL, such as `https://github.com`. */
  host: z.string(),
  /** The repository owner's account or organization name. */
  owner: z.string(),
  /** The repository name. */
  repository: z.string(),
});
export type RemoteRepositoryInformation = z.infer<typeof remoteRepositoryInformation>;

// Note: Will not validate changelogWriterOptions in detail
export const changelogWriterOptions = z.object({
  changelogWriterOptions: z.unknown().optional(),
  /** Repository details that the writer uses to build links to commits and compares. */
  remoteRepositoryInformation: remoteRepositoryInformation.optional(),
});
