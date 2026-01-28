import { Dirent, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { packageSchema, type PackageSchema } from '@/schemas/package.js';

interface ScopeInformation {
  scopeFolderPath: string;
  scopeName: string;
}

export class ScopesReader {
  private readonly scopesInformation: readonly ScopeInformation[];

  constructor(directoryName: string = 'packages') {
    this.scopesInformation = this.getScopesInformation(directoryName);
  }

  get scopes(): string[] {
    if (!this.scopesInformation.length) {
      console.error('No scopes found, returning an empty list');
      return [];
    }
    return this.scopesInformation.map((scopeInformation) => scopeInformation.scopeName);
  }

  private getScopesInformation(
    directoryName: string,
  ): readonly ScopeInformation[] {
    const directoryPath = this.getDirectoryPath(directoryName);
    try {
      return this.mapScopeInformation(
        directoryPath,
        this.filterDirectories(
          this.readDirectories(directoryPath),
        ),
      );
    } catch (err) {
      console.error('Error retrieving scopes information');
      throw err;
    }
  }

  private mapScopeInformation(
    directoryPath: string,
    directories: Dirent[],
  ): ScopeInformation[] {
    return directories.map((folder) => {
      try {
        const folderPath = folder.name;
        return this.formatScopeInformation(
          folderPath,
          this.validatePackageJson(
            this.readPackageJson(
              directoryPath,
              folderPath,
            ),
          ),
        );
      } catch (err) {
        console.error(`Error processing folder ${folder.name}:`, err);
        throw err;
      }
    }).filter((entry): entry is ScopeInformation => entry !== undefined);
  }

  private formatScopeInformation(
    scopeFolderPath: string,
    validatedPkg: PackageSchema,
  ) {
    const { scopeName } = validatedPkg;
    return {
      scopeFolderPath,
      scopeName,
    };
  }

  private getDirectoryPath(directoryName: string): string {
    return join(process.cwd(), directoryName);
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

  private validatePackageJson(pkg: Dirent<string>): PackageSchema {
    const validationResult = packageSchema.safeParse(pkg);
    if (!validationResult.success) {
      throw new Error('Error parsing package.json');
    }
    return validationResult.data;
  }

  private readPackageJson(packagesDirectory: string, folderPath: string): Dirent<string> {
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
