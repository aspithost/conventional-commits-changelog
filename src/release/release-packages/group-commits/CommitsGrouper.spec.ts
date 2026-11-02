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
  subject: null,
};

describe('CommitsGrouper', () => {
  it('should not return any scopes information when the user has not provided any commits', () => {
    const commitsGrouper = new CommitsGrouper({ validatedCommits: [] });

    expect(commitsGrouper.commitsByScopeMap.size).toBe(0);
  });

  describe('grouping of commits by scope', () => {
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

    it('should add scope entries to the commits by scope map', () => {
      const commitsGrouper = new CommitsGrouper({
        validatedCommits: [
          FIRST_BUTTON_COMMIT,
          SECOND_BUTTON_COMMIT,
          CARD_COMMIT,
        ],
      });

      expect(commitsGrouper.commitsByScopeMap.size).toBe(2);
      expect(commitsGrouper.commitsByScopeMap.get('button'))
        .toStrictEqual([FIRST_BUTTON_COMMIT, SECOND_BUTTON_COMMIT]);
      expect(commitsGrouper.commitsByScopeMap.get('card')).toStrictEqual([CARD_COMMIT]);
    });

    it('should skip commits that do not have a scope', () => {
      const commitsGrouper = new CommitsGrouper({
        validatedCommits: [
          CARD_COMMIT,
          {
            ...BASE_COMMIT,
            hash: 'somehash',
            scope: null,
            type: 'feat',
          },
        ],
      });

      expect(commitsGrouper.commitsByScopeMap.size).toBe(1);
      expect(commitsGrouper.commitsByScopeMap.get('card')).toStrictEqual([CARD_COMMIT]);
    });
  });
});
