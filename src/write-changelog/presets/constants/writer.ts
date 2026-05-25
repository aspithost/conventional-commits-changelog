export const COMMIT_TYPES = [
  {
    type: 'build',
    section: 'Build System',
  },
  {
    type: 'ci',
    section: 'Continuous Integration',
  },
  {
    type: 'docs',
    section: 'Documentation',
  },
  {
    type: 'feat',
    section: 'Features',
  },
  {
    type: 'fix',
    section: 'Bug Fixes',
  },
  {
    type: 'perf',
    section: 'Performance Improvements',
  },
  {
    type: 'refactor',
    section: 'Code Refactoring',
  },
  {
    type: 'revert',
    section: 'Reverts',
  },
  {
    type: 'test',
    section: 'Tests',
  },
  // Commit types below not included in CHANGELOG
  {
    type: 'chore',
    section: 'Chores',
    hidden: true,
  },
  {
    type: 'style',
    section: 'Styles',
    hidden: true,
  },
] as const;
export const DEFAULT_ALLOWED_TYPES = COMMIT_TYPES.map((entry) => entry.type);

export const COMMIT_EMOJIS = {
  Features: ':sparkles:',
  'Bug Fixes': ':bug:',
  'Performance Improvements': ':rocket:',
  'Code Refactoring': ':recycle:',
  Reverts: ':rewind:',
  Tests: ':rotating_light:',
  'Build System': ':package:',
  'Continuous Integration': ':construction_worker:',
  Documentation: ':books:',
  Chores: ':construction:',
  Styles: ':art:',
} as const;
