import { CommitParser, type CommitBase, type ParserStreamOptions } from 'conventional-commits-parser';

import { PARSER_STREAM_OPTIONS } from '@/presets/constants/parser.js';

import type { RawCommits } from '@/commits/retriever/CommitsRetriever.js';

export interface ParsedCommit extends CommitBase {
  hash: string | null;
  scope: string | null;
  subject: string | null;
  type: string | null;
}
export type ParsedCommits = Generator<ParsedCommit, void, unknown>;

export class CommitsParser{
  private readonly commitParser: CommitParser;

  constructor(parserStreamOptions: ParserStreamOptions = PARSER_STREAM_OPTIONS) {
    this.commitParser = new CommitParser(parserStreamOptions);
  }

  *getParsedCommits(rawCommits: RawCommits): ParsedCommits {
    for (const { commit, hash } of rawCommits) {
      const parsedCommit = this.commitParser.parse(commit);
      yield {
        ...parsedCommit,
        scope: parsedCommit.scope ?? null,
        subject: parsedCommit.subject ?? null,
        type: parsedCommit.type ?? null,
        hash,
      };
    }
  }
}
 