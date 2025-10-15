import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import commitLintConfig from '@commitlint/config-conventional';
import type { ParserStreamOptions } from 'conventional-commits-parser';

import { ParsedCommitsReader, type ParsedCommits } from '@/commits/parsed-commits-reader/parsedCommitsReader.js';
import { createCommitSchema, type CommitSchema } from '@/schemas/commit.js';
import { packageSchema } from '@/schemas/package.js';

import type { GetCommitsOptions } from '@/commits/commits-reader/commitsReader.js';

interface ScopeInformation<T extends string> {
  scopeFolderPath: string;
  scopeName: T;
}

export class ScopedCommitsReader<T extends string, U extends string> extends ParsedCommitsReader {
  private readonly scopes: readonly T[];
  private readonly types: readonly U[];
  private readonly scopesInformation: readonly ScopeInformation<T>[];
  private commitsByScope: Partial<Record<T, CommitSchema<T, U>[]>> = {};

  constructor(
    allowedScopes?: readonly T[],
    allowedTypes?: readonly U[],
    {
      getCommitsOptions,
      parserStreamOptions,
      directoryName = 'packages',
    }: {
      getCommitsOptions?: GetCommitsOptions;
      parserStreamOptions?: ParserStreamOptions;
      directoryName?: string;
    } = {},
  ) {
    super({ getCommitsOptions, parserStreamOptions });
    this.scopes = allowedScopes ?? this.getScopes();
    this.types = allowedTypes ?? commitLintConfig.rules['type-enum'][2].filter((type): type is U => true);
    this.scopesInformation = this.getScopesInformation(directoryName);
  }

  getScopes(): T[] {
    if (!this.scopesInformation.length) {
      throw new Error('No scopes');
    }
    return this.scopesInformation.map((scopeInformation) => scopeInformation.scopeName);
  }
  
  getCommitsByScope(scope: T): CommitSchema<T, U>[] | undefined {
    return this.commitsByScope[scope];
  }

  async groupCommitsByScope(parsedCommits?: ParsedCommits): Promise<void> {
    for await (const validatedCommit of this.getValidatedCommits(parsedCommits)) {
      const { scope } = validatedCommit;
      if (!(scope in this.commitsByScope)) {
        this.commitsByScope[scope] = [validatedCommit];
      } else if (this.commitsByScope[scope]) {
        this.commitsByScope[scope].push(validatedCommit);
      }
    }
  }

  private async *getValidatedCommits(parsedCommits?: ParsedCommits): AsyncGenerator<CommitSchema<T, U>, void, unknown> {
    const commitSchema = createCommitSchema<T, U>(this.scopes, this.types);
    for await (const parsedCommit of parsedCommits ?? this.getParsedCommits()) {
      const validationResult = commitSchema.safeParse(parsedCommit);
      if (!validationResult.success) {
        console.error('Validation error', validationResult.error);
        continue;
      }
      yield validationResult.data;
    }
  }

  private getScopesInformation(directoryName: string): readonly ScopeInformation<T>[] {
    const packagesDirectory = join(process.cwd(), directoryName);
    
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
}
