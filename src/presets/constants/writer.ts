export const COMMIT_TYPES = [
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
    type: 'style',
    section: 'Styles',
    hidden: true,
  },
  {
    type: 'chore',
    section: 'Chores',
    hidden: true,
  },
];

export const COMMIT_EMOJIS = {
  Features: ':sparkles:',
  'Bug Fixes': ':bug:',
  'Performance Improvements': ':rocket',
  'Refactors': ':recycle:',
  Reverts: ':rewind:',
  Tests: ':rotating_light:',
  'Build System': ':package:',
  'Continuous Integration': ':construction_worker:',
  Documentation: ':books:',
  Chores: ':construction:',
  Styles: ':art:',
} as const;
