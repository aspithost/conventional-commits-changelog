import { CommitParser, type CommitBase, type ParserStreamOptions } from 'conventional-commits-parser';
import type { RawCommits } from '../retrieve-commits/CommitsRetriever.js';
import { PARSER_STREAM_OPTIONS } from './constants/parser.js';

export interface ParsedCommit extends CommitBase {
  hash: string | null;
  scope: string | null;
  subject: string | null;
  type: string | null;
}
export type ParsedCommits = Iterable<ParsedCommit>;
export type CommitsParserOptions = ParserStreamOptions;

export class CommitsParser{
  readonly #commitParser: CommitParser;

  constructor(parserStreamOptions: CommitsParserOptions = PARSER_STREAM_OPTIONS) {
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
