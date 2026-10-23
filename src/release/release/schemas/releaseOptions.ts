import { z } from 'zod';

import { bumpVersionOptions } from '../../../version/schemas/bumpVersionOptions.js';
import type {
  ChangelogWriterOptions as _ChangelogWriterOptions,
} from '../../../write-changelog/ChangelogWriter.js';
import { changelogWriterOptions } from '../../../write-changelog/schemas/changelogWriterOptions.js';
import { releaseType, releaseVersion } from '../../schemas/release.js';

export const baseReleaseOptions = z.object({
  ...bumpVersionOptions.shape,
  /**
   * Options for writing the changelog. Without a `changelogWriterPreset`, the
   * library uses its default preset.
   *
   * @see {@link _ChangelogWriterOptions | ChangelogWriterOptions}
   */
  changelogWriterOptions: changelogWriterOptions.optional(),
  /**
   * Directory that contains the `package.json` and changelog to update.
   *
   * @defaultValue `process.cwd()`
   */
  directoryPath: z.string().optional(),
  /**
   * Logs the release type that the library would apply, without bumping
   * the version or writing the changelog.
   *
   * @defaultValue `false`
   */
  isDryRun: z.boolean().optional(),
  /**
   * Forces a release type when specified.
   * If omitted, the library determines the type from the commits and defaults
   * to `patch` when no commit indicates a release.
   */
  releaseType: releaseType.optional(),
  /**
   * Forces a release version when specified. Must adhere to semver standards.
   * Overrides the `releaseType` parameter if user provides both.
   * If you omit both `releaseType` and `releaseVersion`,
   * the library determines the type from the commits
   * and defaults to patch when no commit indicates a release.
   */
  releaseVersion: releaseVersion.optional(),
});
export type BaseReleaseOptions = z.infer<typeof baseReleaseOptions>;
