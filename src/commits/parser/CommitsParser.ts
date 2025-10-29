import { parseCommits, type CommitBase, type ParserStreamOptions } from 'conventional-commits-parser';

import { PARSER_STREAM_OPTIONS } from '@/presets/constants/parser.js';

import type { RawCommits } from '@/commits/retriever/CommitsRetriever.js';

export type ParsedCommits = AsyncGenerator<CommitBase, void, unknown>;

export class CommitsParser{
  private readonly parserStreamOptions: ParserStreamOptions;

  constructor(parserStreamOptions: ParserStreamOptions = PARSER_STREAM_OPTIONS) {
    this.parserStreamOptions = parserStreamOptions;
  }

  getParsedCommits(rawCommits: RawCommits): ParsedCommits {
    return parseCommits(this.parserStreamOptions)(rawCommits);
  }
}
