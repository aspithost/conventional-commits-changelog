import type { RetrieveCommitsOptions } from '../../commits/retrieveValidatedCommits.js';
import type { ChangelogWriterOptions } from '../../write-changelog/ChangelogWriter.js';

import type { OnError } from '@/utils/error/types/error.js';

/**
 * Options for `generateChangelog`.
 *
 * @typeParam T - Allowed commit scopes.
 * @typeParam U - Allowed commit types.
 */
export interface GenerateChangelogOptions<
  T extends string,
  U extends string,
> extends OnError, RetrieveCommitsOptions<T, U> {
  /**
   * Options for writing the changelog. Without a `changelogWriterPreset`, the
   * library uses its default preset.
   */
  changelogWriterOptions?: Partial<ChangelogWriterOptions>;
  /**
   * Directory that contains the changelog to create.
   *
   * @defaultValue `process.cwd()`
   */
  directoryPath?: string;
  /**
   * Logs the versions that the library would write, without changing any file.
   *
   * @defaultValue `false`
   */
  isDryRun?: boolean;
}
