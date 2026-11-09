export interface DirectoriesReaderOptions {
  /**
   * Directory that contains the packages.
   *
   * @defaultValue `join(process.cwd(), 'packages')`
   */
  directoryPath?: string;
}

/**
 * Maps the package.json names of packages to their corresponding directory paths.
 */
export type PackagesDirectoriesMap = Map<string, { directoryPath: string }>;
