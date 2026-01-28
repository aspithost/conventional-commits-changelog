import type { ParserStreamOptions } from 'conventional-commits-parser';

import { PARSER_STREAM_OPTIONS } from './constants/parser.js';

export function createParserStreamOptions(
  options?: Partial<ParserStreamOptions>,
): ParserStreamOptions {
  return {
    ...PARSER_STREAM_OPTIONS,
    ...options,
  };
}
