import type { RetrieveCommitsOptions } from '../../commits/retrieveValidatedCommits.js';
import type { DefaultAllowedTypes } from '../../commits/types/commit.js';
import type { ValidatedCommit } from '../../commits/validate-commits/types/commit.js';
import type { BumpVersionOptions } from '../../version/bumpVersion.js';
import type { ChangelogWriterOptions } from '../../write-changelog/ChangelogWriter.js';

import type { OnError } from '@/utils/error/types/error.js';

/** Semantic version increment: `major`, `minor`, or `patch`. */
export type ReleaseType = 'major' | 'minor' | 'patch';

/**
 * Options that every release shares. Extends {@link BumpVersionOptions}.
 */
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
   * Forces a release type. Without it, the library determines the type from the commits.
   */
  releaseType?: ReleaseType;
}

/**
 * Options for `release` when the library retrieves commits from git.
 *
 * @typeParam T - Allowed commit scopes.
 * @typeParam U - Allowed commit types.
 */
export type ReleaseOptionsWithoutCommits<
  T extends string,
  U extends DefaultAllowedTypes = DefaultAllowedTypes,
> = BaseReleaseOptions & RetrieveCommitsOptions<T, U>;

/**
 * Options for `release` when you supply the commits yourself.
 *
 * @typeParam T - Allowed commit scopes.
 * @typeParam U - Allowed commit types.
 */
export interface ReleaseOptionsWithCommits<
  T extends string,
  U extends string,
> extends BaseReleaseOptions {
  /** Validated commits to release, instead of commits retrieved from git. */
  commits: Iterable<ValidatedCommit<T, U>>;
}

/**
 * Combined options that the `release` implementation accepts.
 *
 * @typeParam T - Allowed commit scopes.
 * @typeParam U - Allowed commit types.
 */
export interface ReleaseOptions<
  T extends string,
  U extends string,
> extends BaseReleaseOptions, Partial<RetrieveCommitsOptions<T, U>> {
  /** Validated commits to release. When omitted, the library retrieves commits from git. */
  commits?: Iterable<ValidatedCommit<T, U>>;
}
