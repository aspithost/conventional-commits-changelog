import type { RetrieveCommitsOptions } from '../../../commits/retrieveValidatedCommits.js';
import type { DefaultAllowedTypes } from '../../../commits/types/commit.js';
import type { ValidatedCommit } from '../../../commits/validate-commits/types/commit.js';
import type { OnError } from '../../../utils/error/types/error.js';
import type { BumpVersionOptions } from '../../../version/bumpVersion.js';
import type { ChangelogWriterOptions } from '../../../write-changelog/ChangelogWriter.js';

/** Semantic version increment: `major`, `minor`, or `patch`. */
export type ReleaseType = 'major' | 'minor' | 'patch';

export interface BaseReleaseOptions extends Omit<BumpVersionOptions, 'onError'>, OnError {
  /**
   * Options for writing the changelog. Without a `changelogWriterPreset`, the
   * library uses its default preset.
   *
   * @see {@link ChangelogWriterOptions}
   */
  changelogWriterOptions?: Partial<ChangelogWriterOptions>;
  /**
   * Directory that contains the `package.json` and changelog to update.
   *
   * @defaultValue `process.cwd()`
   */
  directoryPath?: string;
  /**
   * Logs the release type that the library would apply, without bumping
   * the version or writing the changelog.
   *
   * @defaultValue `false`
   */
  isDryRun?: boolean;
  /**
   * Forces a release type when specified.
   * If omitted, the library determines the type from the commits and defaults
   * to `patch` when no commit indicates a release.
   */
  releaseType?: ReleaseType;
  /**
   * Forces a release version when specified. Must adhere to semver standards.
   * Overrides the `releaseType` parameter if user provides both.
   * If you omit both `releaseType` and `releaseVersion`,
   * the library determines the type from the commits
   * and defaults to patch when no commit indicates a release.
   */
  releaseVersion?: string;
}

export type ReleaseOptionsWithoutCommits<
  T extends string,
  U extends DefaultAllowedTypes = DefaultAllowedTypes,
> = BaseReleaseOptions & RetrieveCommitsOptions<T, U>;

export interface ReleaseOptionsWithCommits<
  T extends string,
  U extends string,
> extends BaseReleaseOptions {
  /** Validated commits to release, instead of commits retrieved from git. */
  commits: Iterable<ValidatedCommit<T, U>>;
}

export interface ReleaseOptions<
  T extends string,
  U extends string,
> extends BaseReleaseOptions, Partial<RetrieveCommitsOptions<T, U>> {
  /** Validated commits to release. When omitted, the library retrieves commits from git. */
  commits?: Iterable<ValidatedCommit<T, U>>;
}
