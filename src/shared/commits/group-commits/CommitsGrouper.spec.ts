import type { ValidatedCommitWithScope } from '../validate-commits/types/commit.js';
import { CommitsGrouper } from './CommitsGrouper.js';

const BASE_COMMIT = {
  body: null,
  footer: null,
  header: null,
  mentions: [],
  merge: null,
  notes: [],
  references: [],
  revert: null,
};

describe('CommitsGrouper', () => {
  it('should not return any scopes information when the user has not provided any commits', () => {
    const commitsGrouper = new CommitsGrouper([]);

    expect(commitsGrouper.commitsByScope.size).toBe(0);
  });

  describe('grouping of commits by scope', () => {
    it('should add scope entries to the commits by scope map', () => {
      const FIRST_BUTTON_COMMIT = {
        hash: 'abc',
        scope: 'button',
        type: 'fix',
        ...BASE_COMMIT,
      };
      const SECOND_BUTTON_COMMIT = {
        hash: 'def',
        scope: 'button',
        type: 'feat',
        ...BASE_COMMIT,
      };
      const CARD_COMMIT = {
        hash: 'def',
        scope: 'card',
        type: 'feat',
        ...BASE_COMMIT,
      };

      const commitsGrouper = new CommitsGrouper([FIRST_BUTTON_COMMIT, SECOND_BUTTON_COMMIT, CARD_COMMIT]);

      expect(commitsGrouper.commitsByScope.size).toBe(2);
      expect(commitsGrouper.commitsByScope.get('button')).toStrictEqual({ commits: [FIRST_BUTTON_COMMIT, SECOND_BUTTON_COMMIT] });
      expect(commitsGrouper.commitsByScope.get('card')).toStrictEqual({ commits: [CARD_COMMIT] });
    });

    it('should group commits without a scope under the provided root scope name', () => {
      const NULL_SCOPE_COMMIT = {
        hash: 'abc',
        scope: null,
        type: 'fix',
        ...BASE_COMMIT,
      };

      const commitsGrouper = new CommitsGrouper([NULL_SCOPE_COMMIT], 'root');

      expect(commitsGrouper.commitsByScope.get('root')).toStrictEqual({ commits: [NULL_SCOPE_COMMIT] });
    });

    it('should add commits without a scope and with the root scope name to the same map entry', () => {
      const ROOT_SCOPE_NAME = 'root';
      const BUTTON_COMMIT: ValidatedCommitWithScope<string> = {
        hash: 'abc',
        scope: ROOT_SCOPE_NAME,
        type: 'fix',
        ...BASE_COMMIT,
      };
      const NULL_SCOPE_COMMIT: ValidatedCommitWithScope<string> = {
        hash: 'def',
        scope: null,
        type: 'fix',
        ...BASE_COMMIT,
      };

      const commitsGrouper = new CommitsGrouper([BUTTON_COMMIT, NULL_SCOPE_COMMIT], ROOT_SCOPE_NAME);

      expect(commitsGrouper.commitsByScope.get(ROOT_SCOPE_NAME)).toStrictEqual({
        commits: [BUTTON_COMMIT, NULL_SCOPE_COMMIT],
      });
    });
  });
});
