import { readdirSync, readFileSync, type Dirent } from 'node:fs';
import { join } from 'node:path';

import { logError, type ErrorHandler } from '@/utils/error/logError.js';
import { packageJsonSchema, type PackageJsonSchema } from './schemas/package.js';

type RootScopeOptions<T extends string> = {
  addRootScope: true;
  rootScopeDirectoryPath: string;
  rootScopeName: T;
} | {
  addRootScope?: false;
  rootScopeDirectoryPath?: undefined;
  rootScopeName?: undefined;
};

export interface DirectoriesReaderOptions<T extends string> {
  directoryPath?: string;
  rootScopeOptions?: RootScopeOptions<T>;
  onError?: ErrorHandler;
}

// Note: TS workaround so that consumer can see provided root scope key in ScopesMap.
// See: https://stackoverflow.com/questions/61047551/typescript-union-of-string-and-string-literals
type ScopeName<T extends string> = T | (string & {});
export type DirectoryPathByScopeMap<
  T extends string,
> = Map<ScopeName<T>, { directoryPath: string }>;

export class DirectoriesReader<T extends string> {
  readonly #directoryPathByScopeMap: DirectoryPathByScopeMap<T>;
  readonly #onError: ErrorHandler;

  constructor({
    directoryPath = process.cwd(),
    rootScopeOptions = {
      addRootScope: false,
    },
    onError = logError,
  }: DirectoriesReaderOptions<T> = {}) {
    this.#onError = onError;
    this.#directoryPathByScopeMap = this.#createDirectoryPathByScopeMap(
      directoryPath,
      rootScopeOptions,
    );
  }

  // To-do: add documentation
  get scopes(): MapIterator<ScopeName<T>> {
    return this.#directoryPathByScopeMap.keys();
  }

  // To-do: add documentation
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
      this.#onError(`Could not read directory with path: ${directoryPath}`, err);
      throw err;
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
      this.#onError(`Could not read package.json at: ${packageJsonPath}`, err);
      throw err;
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
      const errorMessage = `ScopesMap already contains an entry for ${rootScopeName}. Provide a unique rootScopeName to avoid conflicts.`;
      const error = new Error(errorMessage);
      this.#onError(errorMessage, error);
      throw error;
    }
    scopesMap.set(rootScopeName, {
      directoryPath: rootScopeDirectoryPath,
    });
    return scopesMap;
  }
}
