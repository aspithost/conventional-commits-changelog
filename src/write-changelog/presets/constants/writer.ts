export const COMMIT_TYPES = [
  {
    type: 'feat',
    section: ':sparkles: Features',
  },
  {
    type: 'fix',
    section: ':bug: Bug Fixes',
  },
  {
    type: 'revert',
    section: ':rewind: Reverts',
  },
  {
    type: 'perf',
    section: ':rocket: Performance Improvements',
  },
  {
    type: 'refactor',
    section: ':recycle: Code Refactoring',
  },
  {
    type: 'test',
    section: ':rotating_light: Tests',
  },
  {
    type: 'build',
    section: ':package: Build System',
  },
  {
    type: 'ci',
    section: ':construction_worker: Continuous Integration',
  },

  {
    type: 'docs',
    section: ':books: Documentation',
  },
] as const;
