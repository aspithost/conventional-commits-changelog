import type {
  RetrieveValidatedCommitsOptions,
} from '../../commits/utils/retrieveValidatedCommits.js';
import type { OnError } from '../../utils/error/types/error.js';
import type { ChangelogWriterOptions } from '../../write-changelog/ChangelogWriter.js';

export interface GenerateChangelogOptions extends OnError, RetrieveValidatedCommitsOptions {
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
