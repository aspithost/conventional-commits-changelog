import type { ParserStreamOptions } from 'conventional-commits-parser';

import { ParsedCommitsReader, type ParsedCommits } from '@/commits/parsed-commits-reader/parsedCommitsReader.js';
import { createCommitSchema, type CommitSchema } from '@/schemas/commit.js';

import type { GetCommitsOptions } from '@/commits/commits-reader/commitsReader.js';

export class ValidatedCommitsReader<T extends string, U extends string> extends ParsedCommitsReader {
  readonly scopes: readonly T[];
  readonly types: readonly U[];

  constructor(
    allowedScopes: readonly T[],
    allowedTypes: readonly U[],
    {
      getCommitsOptions,
      parserStreamOptions,
    }: {
      getCommitsOptions?: GetCommitsOptions;
      parserStreamOptions?: ParserStreamOptions;
    } = {},
  ) {
    super({ getCommitsOptions, parserStreamOptions });
    this.scopes = allowedScopes;
    this.types = allowedTypes;
  }

  async *getValidatedCommits(parsedCommits?: ParsedCommits): AsyncGenerator<CommitSchema<T, U>, void, unknown> {
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
}