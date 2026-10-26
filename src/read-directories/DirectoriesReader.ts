import {
  type Dirent, readFileSync, readdirSync,
} from 'node:fs';
import { join } from 'node:path';

import { type PackageJsonSchema, packageJsonSchema } from './schemas/package.js';
import type {
  DirectoriesReaderOptions,
  PackagesDirectoriesMap,
} from './types/directoriesReader.js';

export class DirectoriesReader {
  readonly #packagesDirectoryMap: PackagesDirectoriesMap;

  constructor({
    directoryPath = process.cwd(),
  }: DirectoriesReaderOptions = {}) {
    this.#packagesDirectoryMap = this.#createPackagesDirectoryMap(
      directoryPath,
    );
  }

  get packagesDirectoriesMap(): PackagesDirectoriesMap {
    return this.#packagesDirectoryMap;
  }

  #createPackagesDirectoryMap(
    directoryPath: string,
  ): PackagesDirectoriesMap {
    const directories = this.#readDirectories(directoryPath);
    const filteredDirectories = this.#filterDirectories(directories);
    const packagesDirectoryMap: PackagesDirectoriesMap = new Map();
    this.#addMapEntries(packagesDirectoryMap, filteredDirectories);

    return packagesDirectoryMap;
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
    packagesDirectoryMap: PackagesDirectoriesMap,
    directories: Dirent[],
  ): PackagesDirectoriesMap {
    for (const directory of directories) {
      const directoryPath = join(directory.parentPath, directory.name);
      const packageJson = this.#readPackageJson(directoryPath);
      if (!packageJson) {
        continue;
      }
      const parsedPackageJson = this.#parseJson(packageJson, directoryPath);
      const { name } = this.#validatePackageJson(parsedPackageJson);
      const strippedName = this.#stripScopeFromPackageName(name);
      packagesDirectoryMap.set(strippedName, { directoryPath });
    }
    return packagesDirectoryMap;
  }

  #validatePackageJson(pkg: unknown): PackageJsonSchema {
    const validationResult = packageJsonSchema.safeParse(pkg);
    if (!validationResult.success) {
      throw new Error('Error parsing package.json');
    }
    return validationResult.data;
  }

  #stripScopeFromPackageName(packageName: string): string {
    const parts = packageName.split('/');
    return parts.length > 1 ? parts[1] : parts[0];
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
}
