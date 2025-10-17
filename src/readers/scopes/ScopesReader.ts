import { join } from 'node:path';
import { readdirSync, readFileSync, Dirent } from 'node:fs';
import { packageSchema, type PackageSchema } from '@/schemas/package.js';

export interface ScopeInformation<T extends string> {
  scopeFolderPath: string;
  scopeName: T;
}

export class ScopesReader {
  getScopesInformation<T extends string>(
    directoryName: string,
  ): readonly ScopeInformation<T>[] {
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

  private mapScopeInformation<T extends string>(
    directoryPath: string,
    directories: Dirent[],
  ): ScopeInformation<T>[] {
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
    }).filter((entry): entry is ScopeInformation<T> => entry !== undefined);
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

  // to-do: check if necessary
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
