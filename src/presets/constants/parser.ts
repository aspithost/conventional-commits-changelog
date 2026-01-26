export const PARSER_STREAM_OPTIONS = {
  headerPattern: /^(\w*)(?:\((.*)\))?!?:\s(.*)$/,
  breakingHeaderPattern: /^(\w*)(?:\((.*)\))?!:\s(.*)$/,
  headerCorrespondence: [
    'type',
    'scope',
    'subject',
  ],
  noteKeywords: ['BREAKING CHANGE', 'BREAKING-CHANGE'],
  revertPattern: /^(?:Revert|revert:)\s"?([\s\S]+?)"?\s*This reverts commit (\w*)\./i,
  revertCorrespondence: ['header', 'hash'],
  issuePrefixes: ['gh-'],
};
