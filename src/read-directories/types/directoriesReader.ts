export interface DirectoriesReaderOptions {
  /**
   * Directory that contains the packages.
   *
   * @defaultValue {@link process.cwd}
   */
  directoryPath?: string;
}

/**
 * Maps the package.json names of packages to their corresponding directory paths.
 */
export type PackagesDirectoriesMap = Map<string, { directoryPath: string }>;
