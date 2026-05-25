import { type Dirent, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createPackageSchema, type PackageSchema } from '@/shared/scopes/schemas/package.js';

interface ScopeInformation<T extends string> {
  directoryPath: string;
  scopeName: T;
}
export type ScopesInformation<T extends string> = readonly ScopeInformation<T>[];

export class ScopesReader<T extends string> {
  readonly #scopesInformation: ScopesInformation<T>;

  constructor(directoryPath: string = process.cwd()) {
    this.#scopesInformation = this.#getScopesInformation(directoryPath);
  }

  static withPackagesDirectory<T extends string>() {
    return new ScopesReader<T>(join(process.cwd(), 'packages'));
  }

  get scopes(): T[] {
    if (!this.#scopesInformation.length) {
      return [];
    }
    return this.#scopesInformation.map((scopeInformation) => scopeInformation.scopeName);
  }

  get scopesInformation(): ScopesInformation<T> {
    return this.#scopesInformation;
  }

  // to-do: should only register folders that have a package.json
  // to-do: should silently handle errors in case package.json does not exist in folder
  #getScopesInformation(
    directoryPath: string,
  ): ScopesInformation<T> {
    return this.#mapScopeInformation(
      directoryPath,
      this.#filterDirectories(
        this.#readDirectories(directoryPath),
      ),
    );
  }

  #mapScopeInformation(
    directoryPath: string,
    directories: Dirent[],
  ): ScopesInformation<T> {
    return directories.map((folder) => {
      const folderName = folder.name;
      const folderDirectoryPath = join(directoryPath, folderName);
      return this.#formatScopeInformation(
        folderDirectoryPath,
        this.#validatePackageJson(
          this.#readPackageJson(
            directoryPath,
            folderName,
          ),
        ),
      );
    });
  }

  #formatScopeInformation(
    directoryPath: string,
    validatedPkg: PackageSchema<T>,
  ): ScopeInformation<T> {
    return {
      directoryPath,
      scopeName: validatedPkg.scopeName,
    };
  }

  #readDirectories(directoryPath: string): Dirent[] {
    try {
      return readdirSync(directoryPath, { withFileTypes: true });
    } catch (err) {
      console.error(`Error reading directory with path: ${directoryPath}`);
      throw err;
    }
  }

  #filterDirectories(directories: Dirent[]): Dirent[] {
    return directories.filter((dirent) => dirent.isDirectory());
  }

  #validatePackageJson(pkg: unknown): PackageSchema<T> {
    const validationResult = createPackageSchema<T>().safeParse(pkg);
    if (!validationResult.success) {
      throw new Error('Error parsing package.json');
    }
    return validationResult.data;
  }

  #readPackageJson(packagesDirectory: string, directoryPath: string): unknown {
    try {
      return JSON.parse(
        readFileSync(
          join(
            packagesDirectory,
            directoryPath,
            'package.json',
          ),
          'utf-8',
        ),
      );
    } catch (err) {
      console.error(`Could not read package.json in directory ${packagesDirectory} with path: ${directoryPath}`);
      throw err;
    }
  }
}
