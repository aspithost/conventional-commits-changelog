import {
  type Dirent, readFileSync, readdirSync,
} from 'node:fs';
import { join } from 'node:path';

import { type PackageJsonSchema, packageJsonSchema } from './schemas/package.js';
import type {
  DirectoriesReaderOptions, DirectoryPathByScopeMap, RootScopeOptions,
  ScopeName,
} from './types/directoriesReader.js';

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
