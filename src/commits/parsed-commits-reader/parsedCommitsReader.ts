import {
  parseCommits,
  type CommitBase,
  type ParserStreamOptions,
} from 'conventional-commits-parser';

import {
  CommitsReader,
  type RawCommits,
  type GetCommitsOptions,
} from '@/commits/commits-reader/commitsReader.js';
import { PARSER_STREAM_OPTIONS } from '@/constants/parser.js';

export type ParsedCommits = AsyncGenerator<CommitBase, void, unknown>;

export class ParsedCommitsReader extends CommitsReader {
  readonly parserStreamOptions: ParserStreamOptions;

  constructor({
    getCommitsOptions,
    parserStreamOptions = PARSER_STREAM_OPTIONS,
  }: {
    getCommitsOptions?: GetCommitsOptions;
    parserStreamOptions?: ParserStreamOptions;
  } = {}) {
    super(getCommitsOptions);
    this.parserStreamOptions = parserStreamOptions;
  }

  getParsedCommits(rawCommits?: RawCommits): ParsedCommits {
    return parseCommits(this.parserStreamOptions)(rawCommits ?? this.getRawCommits());
  }
}
