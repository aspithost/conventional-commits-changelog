import { CommitParser, type CommitBase, type ParserStreamOptions } from 'conventional-commits-parser';

import { PARSER_STREAM_OPTIONS } from '@/presets/constants/parser.js';

import type { RawCommits } from '@/commits/retriever/CommitsRetriever.js';

export interface ParsedCommit extends CommitBase {
  hash: string | null;
  scope: string | null;
  subject: string | null;
  type: string | null;
}
export type ParsedCommits = Iterable<ParsedCommit>;

export class CommitsParser{
  readonly #commitParser: CommitParser;

  constructor(parserStreamOptions: ParserStreamOptions = PARSER_STREAM_OPTIONS) {
    this.#commitParser = new CommitParser(parserStreamOptions);
  }

  *getParsedCommits(rawCommits: RawCommits): ParsedCommits {
    for (const { commit, hash } of rawCommits) {
      const parsedCommit = this.#commitParser.parse(commit);
      yield {
        ...parsedCommit,
        hash,
        // Note: scope, subject, type should be properly handled by conventional-commits-parser.
        // Not included on interface in CommitBase or Commit, so adding them here with fallback of null.
        scope: parsedCommit.scope ?? null,
        subject: parsedCommit.subject ?? null,
        type: parsedCommit.type ?? null,
      };
    }
  }
}
