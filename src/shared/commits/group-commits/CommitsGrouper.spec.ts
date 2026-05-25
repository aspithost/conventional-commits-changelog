import { ScopesReader } from '@/shared/scopes/ScopesReader.js';

import { CommitsGrouper } from './CommitsGrouper.js';

import type { ValidatedCommitWithScope } from '../validate-commits/types/commits.js';

const { MOCK_SCOPES_INFORMATION,
} = vi.hoisted(() => ({
  MOCK_SCOPES_INFORMATION: [
    { scopeName: 'button', directoryPath: '/packages/button' },
    { scopeName: 'card', directoryPath: '/packages/card' },
  ] as const,
}));

vi.mock('@/shared/scopes/ScopesReader.js', () => ({
  ScopesReader: {
    withPackagesDirectory: vi.fn().mockReturnValue({
      scopesInformation: MOCK_SCOPES_INFORMATION,
    }),
    scopesInformationGetter: vi.fn(),
  },
}));

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
  describe('constructor options', () => {
    it('should retrieve scopes when the user does not provide scopes information', () => {
      const _ = new CommitsGrouper([]);

      const { withPackagesDirectory } = vi.mocked(ScopesReader);
      expect(withPackagesDirectory).toHaveBeenCalledOnce();
    });

    it('does not create a ScopesReader instance when the user provides scopes information', () => {
      const _ = new CommitsGrouper([], { scopesInformation: MOCK_SCOPES_INFORMATION });

      const { withPackagesDirectory } = vi.mocked(ScopesReader);
      expect(withPackagesDirectory).not.toHaveBeenCalled();
    });

    it('should default to a root scope name of "root"', () => {
      const commitsGrouper = new CommitsGrouper([]);

      expect([...commitsGrouper.scopes]).toContain('root');
    });

    it('should allow consumers to pass in a custom root scope name', () => {
      const ROOT_SCOPE_NAME = 'some-scope';

      const commitsGrouper = new CommitsGrouper([], { rootScopeName: ROOT_SCOPE_NAME });
      const [firstScope] = commitsGrouper.scopes;
      expect(firstScope).toBe(ROOT_SCOPE_NAME);
      expect(commitsGrouper.commitsByScope.has(ROOT_SCOPE_NAME));
      expect(commitsGrouper.commitsByScope.get(ROOT_SCOPE_NAME)).toStrictEqual({
        commits: [],
        directoryPath: process.cwd(),
      });
    });
  });

  describe('grouping of commits by scope', () => {
    it('should initialize a scopes map with the scope name as key, and the directory path and commits as values', () => {
      const commitsGrouper = new CommitsGrouper([]);
      const [...entries] = commitsGrouper.commitsByScope.entries();
      expect(entries).toContainEqual([
        'root', {
          commits: [],
          directoryPath: process.cwd(),
        }],
      );
      expect(entries).toContainEqual([
        MOCK_SCOPES_INFORMATION[0].scopeName, {
          commits: [],
          directoryPath: MOCK_SCOPES_INFORMATION[0].directoryPath,
        },
      ]);
      expect(entries).toContainEqual([
        MOCK_SCOPES_INFORMATION[1].scopeName, {
          commits: [],
          directoryPath: MOCK_SCOPES_INFORMATION[1].directoryPath,
        },
      ]);
    });

    it('should group valid commits by scope', () => {
      const BUTTON_COMMIT: ValidatedCommitWithScope<string, string> = {
        hash: 'abc',
        scope: 'button',
        type: 'fix',
        ...BASE_COMMIT,
      };
      const CARD_COMMIT: ValidatedCommitWithScope<string, string> = {
        hash: 'def',
        scope: 'card',
        type: 'feat',
        ...BASE_COMMIT,
      };
      const LINK_COMMIT: ValidatedCommitWithScope<string, string> = {
        hash: 'ghi',
        scope: 'link',
        type: 'fix',
        ...BASE_COMMIT,
      };
      const NULL_SCOPE_COMMIT: ValidatedCommitWithScope<string, string> = {
        hash: 'abc',
        scope: null,
        type: 'fix',
        ...BASE_COMMIT,
      };
      const commitsGrouper = new CommitsGrouper([BUTTON_COMMIT, CARD_COMMIT, LINK_COMMIT, NULL_SCOPE_COMMIT]);

      expect(commitsGrouper.commitsByScope.has('root')).toBe(true);
      expect(commitsGrouper.commitsByScope.get('button')).toMatchObject({ commits: [BUTTON_COMMIT] });
      expect(commitsGrouper.commitsByScope.get('card')).toMatchObject({ commits: [CARD_COMMIT] });
      // Scope 'link' not included in scopesInformation, so not included in grouped commits
      expect(commitsGrouper.commitsByScope.has('link')).toBe(false);
      // Should add commits without a scope to the root scope
      expect(commitsGrouper.commitsByScope.get('root')).toMatchObject({ commits: [NULL_SCOPE_COMMIT] });
    });
  });
});

