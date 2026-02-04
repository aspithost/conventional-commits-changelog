import type { ParserStreamOptions } from 'conventional-commits-parser';

export const PARSER_STREAM_OPTIONS = {
  breakingHeaderPattern: /^(\w*)(?:\((.*)\))?!:\s(.*)$/,
  fieldPattern: /^-(.*?)-$/,
  headerCorrespondence: [
    'type',
    'scope',
    'subject',
  ],
  headerPattern: /^(\w*)(?:\((.*)\))?!?:\s(.*)$/,
  issuePrefixes: ['#', 'gh-', 'GH-'],
  noteKeywords: ['BREAKING CHANGE', 'BREAKING-CHANGE'],
  referenceActions: [
    'close',
    'closes',
    'closed',
    'fix',
    'fixes',
    'fixed',
    'resolve',
    'resolves',
    'resolved',
  ],
  revertCorrespondence: ['header', 'hash'],
  revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w*)\./i,
} satisfies ParserStreamOptions;
