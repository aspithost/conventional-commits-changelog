import { Dirent, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { packageSchema, type PackageSchema } from '@/schemas/package.js';

export interface ScopeInformation {
  scopePath: string;
  scopeName: string;
}

export class ScopesReader {
  private readonly scopesInformation: readonly ScopeInformation[];

  constructor(directoryPath: string = join(process.cwd(), 'packages')) {
    this.scopesInformation = this.getScopesInformation(directoryPath);
  }

  get scopes(): string[] {
    if (!this.scopesInformation.length) {
      return [];
    }
    return this.scopesInformation.map((scopeInformation) => scopeInformation.scopeName);
  }

  get scopeEntries(): readonly ScopeInformation[] {
    return this.scopesInformation;
  }

  private getScopesInformation(
    directoryPath: string,
  ): readonly ScopeInformation[] {
    return this.mapScopeInformation(
      directoryPath,
      this.filterDirectories(
        this.readDirectories(directoryPath),
      ),
    );
  }

  private mapScopeInformation(
    directoryPath: string,
    directories: Dirent[],
  ): ScopeInformation[] {
    return directories.map((folder) => {
      const folderName = folder.name;
      const folderPath = join(directoryPath, folderName);
      return this.formatScopeInformation(
        folderPath,
        this.validatePackageJson(
          this.readPackageJson(
            directoryPath,
            folderName,
          ),
        ),
      );
    });
  }

  private formatScopeInformation(
    folderPath: string,
    validatedPkg: PackageSchema,
  ): ScopeInformation {
    return {
      scopePath: folderPath,
      scopeName: validatedPkg.scopeName,
    };
  }

  private readDirectories(directoryPath: string): Dirent<string>[] {
    try {
      return readdirSync(directoryPath, { withFileTypes: true });
    } catch (err) {
      console.error(`Error reading directory with path: ${directoryPath}`);
      throw err;
    }
  }

  private filterDirectories(directories: Dirent<string>[]): Dirent<string>[] {
    return directories.filter((dirent) => dirent.isDirectory());
  }

  private validatePackageJson(pkg: unknown): PackageSchema {
    const validationResult = packageSchema.safeParse(pkg);
    if (!validationResult.success) {
      throw new Error('Error parsing package.json');
    }
    return validationResult.data;
  }

  private readPackageJson(packagesDirectory: string, folderPath: string): unknown {
    try {
      return JSON.parse(
        readFileSync(
          join(
            packagesDirectory,
            folderPath,
            'package.json',
          ),
          'utf-8',
        ),
      );
    } catch (err) {
      console.error(`Could not read package.json in directory ${packagesDirectory} with folder path: ${folderPath}`);
      throw err;
    }
  }
}
