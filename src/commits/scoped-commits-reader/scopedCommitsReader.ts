import type { ParserStreamOptions } from 'conventional-commits-parser';
import commitLintConfig from '@commitlint/config-conventional';

import { ValidatedCommitsReader } from '@/commits/validated-commits-reader/validatedCommitsReader.js';
import { ScopesReader } from '@/scopes/scopesReader.js';

import type { GetCommitsOptions } from '@/commits/commits-reader/commitsReader.js';
import type { ParsedCommits } from '@/commits/parsed-commits-reader/parsedCommitsReader.js';
import type { CommitSchema } from '@/schemas/commit.js';

export class ScopedCommitsReader<
  T extends string,
  U extends string,
> extends ValidatedCommitsReader<T, U> {
  private commitsByScope: Partial<Record<T, CommitSchema<T, U>[]>> = {};

  constructor(
    allowedScopes: readonly T[] = new ScopesReader<T>().getScopes(),
    allowedTypes: readonly U[] = commitLintConfig.rules['type-enum'][2].filter((type): type is U => true),
    {
      getCommitsOptions,
      parserStreamOptions,
    }: {
      getCommitsOptions?: GetCommitsOptions;
      parserStreamOptions?: ParserStreamOptions;
    } = {},
  ) {
    super(
      allowedScopes,
      allowedTypes,
      {
        getCommitsOptions,
        parserStreamOptions,
      },
    );
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

  getCommitsByScope(scope: T): CommitSchema<T, U>[] | undefined {
    return this.commitsByScope[scope];
  }
}
