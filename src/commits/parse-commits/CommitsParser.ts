import {
  type CommitBase,
  CommitParser,
  type ParserStreamOptions,
} from 'conventional-commits-parser';

import type { RawCommits } from '../retrieve-commits/CommitsRetriever.js';

import { PARSER_STREAM_OPTIONS } from './constants/parser.js';

/** A commit message parsed into conventional-commit fields with its source hash. */
export interface ParsedCommit extends CommitBase {
  /** The full hash of the source commit, or `null` when unavailable. */
  hash: string | null;
  /** The parsed commit scope, or `null` when the message has no scope. */
  scope: string | null;
  /** The parsed commit subject, or `null` when the message has no subject. */
  subject: string | null;
  /** The parsed commit type, or `null` when the message has no type. */
  type: string | null;
}

/** An iterable collection of parsed commits. */
export type ParsedCommits = Iterable<ParsedCommit>;

/** Options for configuring {@link CommitsParser}. */
export interface CommitsParserOptions {
  /**
   * Configuration for parsing commit messages.
   *
   * @defaultValue {@link PARSER_STREAM_OPTIONS}
   */
  parserStreamOptions?: ParserStreamOptions;
}

export class CommitsParser {
  readonly #commitParser: CommitParser;

  constructor({ parserStreamOptions = PARSER_STREAM_OPTIONS }: CommitsParserOptions = {}) {
    this.#commitParser = new CommitParser(parserStreamOptions);
  }

  *getParsedCommits(rawCommits: RawCommits): ParsedCommits {
    for (const { commit, hash } of rawCommits) {
      const parsedCommit = this.#commitParser.parse(commit);
      yield {
        ...parsedCommit,
        hash,
        // Note: scope, subject, type should be properly handled by conventional-commits-parser.
        // Not included on interface in CommitBase/Commit, adding them here with fallback of null.
        scope: parsedCommit.scope ?? null,
        subject: parsedCommit.subject ?? null,
        type: parsedCommit.type ?? null,
      };
    }
  }
}
