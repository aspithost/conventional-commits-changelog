import { parseCommits, type CommitBase, type ParserStreamOptions } from 'conventional-commits-parser';

import { PARSER_STREAM_OPTIONS } from '@/presets/constants/parser.js';

import type { RawCommits } from '@/commits/retriever/CommitsRetriever.js';

export interface ParsedCommit extends CommitBase {
  hash: string;
}
export type ParsedCommits = AsyncGenerator<ParsedCommit, void, unknown>;

export class CommitsParser{
  private readonly parserStreamOptions: ParserStreamOptions;

  constructor(parserStreamOptions: ParserStreamOptions = PARSER_STREAM_OPTIONS) {
    this.parserStreamOptions = parserStreamOptions;
  }

  async *getParsedCommits(rawCommits: RawCommits): ParsedCommits {
    for (const { hash, body } of rawCommits) {
      for await (const commit of parseCommits(this.parserStreamOptions)([body])) {
        yield { ...commit, hash };
      }
    }
  }
}
