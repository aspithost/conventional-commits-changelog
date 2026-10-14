import {
  type Dirent, readFileSync, readdirSync,
} from 'node:fs';
import { join } from 'node:path';

import { type PackageJsonSchema, packageJsonSchema } from './schemas/package.js';

type RootScopeOptions<T extends string> = {
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

export class DirectoriesReader<T extends string> {
  readonly #directoryPathByScopeMap: DirectoryPathByScopeMap<T>;

  constructor({
    directoryPath = process.cwd(),
    rootScopeOptions = {
      addRootScope: false,
    },
  }: DirectoriesReaderOptions<T> = {}) {
    this.#directoryPathByScopeMap = this.#createDirectoryPathByScopeMap(
      directoryPath,
      rootScopeOptions,
    );
  }

  get scopes(): MapIterator<ScopeName<T>> {
    return this.#directoryPathByScopeMap.keys();
  }

  get directoryPathByScopeMap(): DirectoryPathByScopeMap<T> {
    return this.#directoryPathByScopeMap;
  }

  #createDirectoryPathByScopeMap(
    directoryPath: string,
    rootScopeOptions?: RootScopeOptions<T>,
  ): DirectoryPathByScopeMap<T> {
    const directories = this.#readDirectories(directoryPath);
    const filteredDirectories = this.#filterDirectories(directories);
    const scopesMap: DirectoryPathByScopeMap<T> = new Map();
    this.#addMapEntries(scopesMap, filteredDirectories);

    if (rootScopeOptions?.addRootScope) {
      const { rootScopeName, rootScopeDirectoryPath } = rootScopeOptions;
      this.#addRootScopeEntry(
        scopesMap,
        rootScopeName,
        rootScopeDirectoryPath,
      );
    }

    return scopesMap;
  }

  #readDirectories(directoryPath: string): Dirent[] {
    try {
      return readdirSync(directoryPath, {
        recursive: true,
        withFileTypes: true,
      });
    } catch (err) {
      throw new Error(`Could not read directory with path: ${directoryPath}`, { cause: err });
    }
  }

  #filterDirectories(directories: Dirent[]): Dirent[] {
    return directories.filter((dirent) => dirent.isDirectory());
  }

  #addMapEntries(
    scopesMap: DirectoryPathByScopeMap<T>,
    directories: Dirent[],
  ): DirectoryPathByScopeMap<T> {
    for (const directory of directories) {
      const directoryPath = join(directory.parentPath, directory.name);
      const packageJson = this.#readPackageJson(directoryPath);
      if (!packageJson) {
        continue;
      }
      const parsedPackageJson = this.#parseJson(packageJson, directoryPath);
      const { name } = this.#validatePackageJson(parsedPackageJson);
      scopesMap.set(name, { directoryPath });
    }
    return scopesMap;
  }
  #validatePackageJson(pkg: unknown): PackageJsonSchema {
    const validationResult = packageJsonSchema.safeParse(pkg);
    if (!validationResult.success) {
      throw new Error('Error parsing package.json');
    }
    return validationResult.data;
  }

  #parseJson(json: string, packageJsonPath: string): unknown {
    try {
      return JSON.parse(json);
    } catch (err) {
      throw new Error(`Invalid JSON in package.json at: ${packageJsonPath}`, { cause: err });
    }
  }

  #readPackageJson(directoryPath: string): string | undefined {
    const packageJsonPath = join(directoryPath, 'package.json');
    try {
      return readFileSync(packageJsonPath, 'utf-8');
    } catch (err) {
      if (this.#isFileNotFoundError(err)) {
        // no package.json in this folder, silently handle error and return
        return;
      }
      throw new Error(`Could not read package.json at: ${packageJsonPath}`, { cause: err });
    }
  }

  #isFileNotFoundError(err: unknown): err is NodeJS.ErrnoException {
    return err instanceof Error && 'code' in err && err.code === 'ENOENT';
  }

  #addRootScopeEntry(
    scopesMap: DirectoryPathByScopeMap<T>,
    rootScopeName: T,
    rootScopeDirectoryPath: string,
  ): DirectoryPathByScopeMap<T> {
    if (scopesMap.get(rootScopeName)) {
      const errorMessage =
        `ScopesMap already contains an entry for ${rootScopeName}. ` +
        'Provide a unique rootScopeName to avoid conflicts.';
      throw new Error(errorMessage);
    }
    scopesMap.set(rootScopeName, {
      directoryPath: rootScopeDirectoryPath,
    });
    return scopesMap;
  }
}
