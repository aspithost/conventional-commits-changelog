import { CommitParser, type CommitBase, type ParserStreamOptions } from 'conventional-commits-parser';

import { PARSER_STREAM_OPTIONS } from '@/presets/constants/parser.js';

import type { RawCommits } from '@/commits/retriever/CommitsRetriever.js';

export interface ParsedCommit extends CommitBase {
  hash: string;
}
export type ParsedCommits = AsyncGenerator<ParsedCommit, void, unknown>;

export class CommitsParser{
  private readonly commitParser: CommitParser;

  constructor(parserStreamOptions: ParserStreamOptions = PARSER_STREAM_OPTIONS) {
    this.commitParser = new CommitParser(parserStreamOptions);
  }

  async *getParsedCommits(rawCommits: RawCommits): ParsedCommits {
    for (const { hash, body } of rawCommits) {
      const commit = this.commitParser.parse(body);
      yield { ...commit, hash };
    }
  }
}
