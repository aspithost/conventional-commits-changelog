export interface DirectoriesReaderOptions {
  /**
   * Directory that contains the packages.
   *
   * @defaultValue `join(process.cwd(), 'packages')`
   */
  directoryPath?: string;
  /**
   * Maps package.json names to a commit scope.
   *
   * @example
   * ```
   * const packageToScopeMap = new Map<string, string>([
   *   ['@abelspithost/my-package', 'my-package'],
   *   ['button-with-very-long-name', 'button']
   * ]);
   * ```
   */
  packageNameToScopeMap?: Map<string, string>;
}

/**
 * Maps the package.json names of packages to their corresponding directory paths.
 */
export type PackagesDirectoriesMap = Map<string, { directoryPath: string }>;
