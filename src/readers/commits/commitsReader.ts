import { execSync } from 'node:child_process';

import commitLintConfig from '@commitlint/config-conventional';
import {
  parseCommits,
  type CommitBase,
  type ParserStreamOptions,
} from 'conventional-commits-parser';

import { PARSER_STREAM_OPTIONS } from '@/constants/parser.js';
import { createCommitSchema, type CommitSchema } from '@/schemas/commit.js';
import { ScopesReader, type ScopeInformation } from '@/readers/scopes/ScopesReader.js';

export interface GetCommitsOptions {
  from?: string;
  to?: string;
}
export type RawCommits = Generator<string, void, unknown>;
export type ParsedCommits = AsyncGenerator<CommitBase, void, unknown>;

export class CommitsReader<T extends string, U extends string> {
  private readonly scopesInformation: readonly ScopeInformation<T>[];
  private readonly commitSchema: ReturnType<typeof createCommitSchema<T, U>>;
  private readonly getCommitsOptions: GetCommitsOptions;
  private readonly parserStreamOptions: ParserStreamOptions;

  private commitsByScope: Partial<Record<T, CommitSchema<T, U>[]>> = {};
  
  constructor(
    {
      allowedScopes,
      allowedTypes,
      directoryName = 'packages',
      getCommitsOptions = {
        from: undefined,
        to: 'HEAD',
      },
      parserStreamOptions = PARSER_STREAM_OPTIONS,
    }: {
      allowedScopes?: readonly T[];
      allowedTypes?: readonly U[];
      directoryName?: string;
      getCommitsOptions?: GetCommitsOptions;
      parserStreamOptions?: ParserStreamOptions;
    } = {},
  ) {
    // to-do: extends scopesreader instead?
    this.scopesInformation = new ScopesReader().getScopesInformation<T>(directoryName);
    this.commitSchema = this.createCommitSchema(allowedScopes, allowedTypes);
    this.getCommitsOptions = getCommitsOptions;
    this.parserStreamOptions = parserStreamOptions
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

  private get scopes(): T[] {
    if (!this.scopesInformation.length) {
      throw new Error('No scopes');
    }
    return this.scopesInformation.map((scopeInformation) => scopeInformation.scopeName);
  }

  private get commitFormat() {
    return '--commitFormat="%H %B%x00';
  }

  private get commitRange() {
    const from = this.getCommitsOptions.from ?? this.getLatestTag();
    const { to } = this.getCommitsOptions;
    return from ? `${from}..${to}` : to;
  }

  private createCommitSchema(
    allowedScopes?: readonly T[],
    allowedTypes?: readonly U[],
  ): ReturnType<typeof createCommitSchema<T, U>> {
    return createCommitSchema<T, U>(
      allowedScopes ?? ['root' as T, ...this.scopes],
      allowedTypes ?? commitLintConfig.rules['type-enum'][2].filter((type): type is U => true),
    );
  }

  private async *getValidatedCommits(parsedCommits?: ParsedCommits): AsyncGenerator<CommitSchema<T, U>, void, unknown> {
    for await (const parsedCommit of parsedCommits ?? this.getParsedCommits()) {
      const validationResult = this.commitSchema.safeParse(parsedCommit);
      if (!validationResult.success) {
        console.error('Validation error', validationResult.error);
        continue;
      }
      yield validationResult.data;
    }
  }

  private getParsedCommits(rawCommits?: RawCommits): ParsedCommits {
    return parseCommits(this.parserStreamOptions)(rawCommits ?? this.getRawCommits());
  }
  
  private *getRawCommits(): RawCommits {
    try {
      const commitsString = this.getRawCommitsString();
      for (const rawCommit of commitsString.split('\x00')) {
        const commit = rawCommit.trim();
        if (commit) {
          yield commit;
        }
      }
    } catch {
      console.error('Could not retrieve commits.');
      return;
    }
  }

  private getRawCommitsString(): string {
    const command = `git log --no-abbrev-commit ${this.commitFormat} ${this.commitRange}`;
    return execSync(command, { encoding: 'utf-8' }).trim();
  }

  private getLatestTag() {
    try {
      return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' });
    } catch {
      console.log('No tags found.');
      return null;
    }
  }
}
