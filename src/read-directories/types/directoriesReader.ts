export type RootScopeOptions<T extends string> = {
  addRootScope: true;
  /**
   * The directory path of the root scope.
   * @remarks You should specify this path if you set `addRootScope` to `true`.
   */
  rootScopeDirectoryPath: string;
  /**
   * The name of the root scope.
   * @remarks You should specify this name if you set `addRootScope` to `true`.
   */
  rootScopeName: T;
} | {
  /**
   * Whether to add the repository root as an extra scope.
   *
   * @defaultValue `false`
   */
  addRootScope?: false;
};

export interface DirectoriesReaderOptions<T extends string> {
  /**
   * Directory that contains the packages.
   *
   * @defaultValue {@link process.cwd}
   */
  directoryPath?: string;
  /**
   * Options for adding the repository root as an extra scope.
   *
   * @see {@link RootScopeOptions}
   */
  rootScopeOptions?: RootScopeOptions<T>;
}

// Note: TS workaround so that consumer can see provided root scope key in ScopesMap.
// See: https://stackoverflow.com/questions/61047551/typescript-union-of-string-and-string-literals
export type ScopeName<T extends string> = T | (string & {});
export type DirectoryPathByScopeMap<
  T extends string,
> = Map<ScopeName<T>, { directoryPath: string }>;
