import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { packageSchema } from '@/schemas/package.js';

export interface ScopeInformation<T extends string> {
  scopeFolderPath: string;
  scopeName: T;
}

export class ScopesReader<T extends string> {
  readonly directoryName: string;
  readonly scopesInformation: readonly ScopeInformation<T>[];

  constructor({ directoryName = 'packages' }: {
    directoryName?: string;
  } = {}) {
    this.directoryName = directoryName;
    this.scopesInformation = this.getScopesInformation();
  }

  private getScopesInformation(): readonly ScopeInformation<T>[] {
    const packagesDirectory = join(process.cwd(), this.directoryName);
    
    try {
      return [
        ...readdirSync(packagesDirectory, { withFileTypes: true })
          .filter((dirent) => dirent.isDirectory())
          .map((folder) => {
            try {
              const pkg = JSON.parse(
                readFileSync(
                  join(
                    packagesDirectory,
                    folder.name,
                    'package.json',
                  ),
                  'utf-8',
                ),
              );
              const validatedPackage = packageSchema.safeParse(pkg);
              if (validatedPackage.success) {
                const { scopeName } = validatedPackage.data;
                return {
                  scopeFolderPath: folder.name,
                  scopeName,
                };
              };
            } catch {
              return;
            }
          }).filter((entry): entry is ScopeInformation<T> => entry !== undefined),
        ];
    } catch (err) {
      console.error('Error reading packages folder:', err);
      throw err;
    }
  }

  getScopes(): T[] {
    if (!this.scopesInformation.length) {
      throw new Error('No scopes');
    }
    return this.scopesInformation.map((scopeInformation) => scopeInformation.scopeName);
  }
}
