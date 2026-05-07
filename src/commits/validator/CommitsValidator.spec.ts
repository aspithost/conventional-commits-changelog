import type { ParsedCommit, ParsedCommits } from '../parser/CommitsParser.js';

import { CommitsValidator, DEFAULT_ALLOWED_TYPES } from './CommitsValidator.js';

vi.mock('@/scopes/ScopesReader.js', () => ({
  ScopesReader: class {
    get scopes() {
      return ['packageOne', 'packageTwo', 'packageThree'];
    }
  },
}));

function* createParsedCommits(commits: ParsedCommit[]): ParsedCommits {
  yield* commits;
}

const BASE_PARSED_COMMIT = {
  hash: 'abc123',
  merge: null,
  revert: null,
  header: 'feat(packageOne): add new feature',
  scope: 'packageOne',
  type: 'feat',
  subject: 'add new feature',
  body: 'This is the body of the commit message.',
  footer: null,
  notes: [],
  mentions: [],
  references: [],
} satisfies ParsedCommit;

const ALLOWED_SCOPES = ['packageOne', 'packageTwo', 'packageThree'] as const;
const ALLOWED_TYPES = ['feat', 'fix', 'docs'] as const;

describe('CommitsValidator', () => {
  describe('getValidatedCommits', () => {
    it('should yield valid commits', () => {
      const parsedCommits = createParsedCommits([BASE_PARSED_COMMIT]);
      const validator = new CommitsValidator(ALLOWED_SCOPES, ALLOWED_TYPES);

      const validatedCommits = [...validator.getValidatedCommits(parsedCommits)];

      expect(validatedCommits).toHaveLength(1);
      expect(validatedCommits[0]).toStrictEqual(BASE_PARSED_COMMIT);
    });

    it('should not yield commits with invalid scope', () => {
      const parsedCommits = createParsedCommits([
        { ...BASE_PARSED_COMMIT, scope: 'invalid-scope' },
      ]);
      const validator = new CommitsValidator(ALLOWED_SCOPES, ALLOWED_TYPES);

      const validatedCommits = [...validator.getValidatedCommits(parsedCommits)];

      expect(validatedCommits).toHaveLength(0);
    });

    it('should not yield commits with invalid type', () => {
      const parsedCommits = createParsedCommits([
        { ...BASE_PARSED_COMMIT, type: 'invalid-type' },
      ]);
      const validator = new CommitsValidator(ALLOWED_SCOPES, ALLOWED_TYPES);

      const validatedCommits = [...validator.getValidatedCommits(parsedCommits)];

      expect(validatedCommits).toHaveLength(0);
    });

    it('should handle empty input', () => {
      const parsedCommits = createParsedCommits([]);
      const validator = new CommitsValidator(ALLOWED_SCOPES, ALLOWED_TYPES);

      const validatedCommits = [...validator.getValidatedCommits(parsedCommits)];

      expect(validatedCommits).toHaveLength(0);
    });

    it('should yield only valid commits when input contains both valid and invalid', () => {
      const parsedCommits = createParsedCommits([
        BASE_PARSED_COMMIT,
        { ...BASE_PARSED_COMMIT, hash: 'def456', scope: 'invalid-scope' },
        { ...BASE_PARSED_COMMIT, hash: 'ghi789', type: 'fix' },
      ]);
      const validator = new CommitsValidator(ALLOWED_SCOPES, ALLOWED_TYPES);

      const validatedCommits = [...validator.getValidatedCommits(parsedCommits)];

      expect(validatedCommits).toHaveLength(2);
      expect(validatedCommits[0]).toMatchObject({ hash: 'abc123' });
      expect(validatedCommits[1]).toMatchObject({ hash: 'ghi789' });
    });
  });

  describe('factory methods', () => {
    it('withDefaultTypes should use provided scopes and default types', () => {
      const commitCustomScope = { ...BASE_PARSED_COMMIT, scope: 'custom' };
      const parsedCommits = createParsedCommits([commitCustomScope]);
      const validator = CommitsValidator.withDefaultTypes(['custom'] as const);

      const validatedCommits = [...validator.getValidatedCommits(parsedCommits)];

      expect(validatedCommits).toHaveLength(1);
      expect(validatedCommits[0]).toStrictEqual(commitCustomScope);
    });

    it('withDefaultScopes should use ScopesReader scopes and provided types', () => {
      const commitCustomType = { ...BASE_PARSED_COMMIT, type: 'custom-type' };
      const parsedCommits = createParsedCommits([commitCustomType]);
      const validator = CommitsValidator.withDefaultScopes(['custom-type'] as const);

      const validatedCommits = [...validator.getValidatedCommits(parsedCommits)];

      expect(validatedCommits).toHaveLength(1);
      expect(validatedCommits[0]).toStrictEqual(commitCustomType);
    });

    it('withDefaultScopesAndTypes should use ScopesReader scopes and default types', () => {
      const commit = { ...BASE_PARSED_COMMIT, scope: 'packageThree', type: DEFAULT_ALLOWED_TYPES[0] };
      const parsedCommits = createParsedCommits([commit]);
      const validator = CommitsValidator.withDefaultScopesAndTypes();

      const validatedCommits = [...validator.getValidatedCommits(parsedCommits)];

      expect(validatedCommits).toHaveLength(1);
      expect(validatedCommits[0]).toStrictEqual(commit);
    });
  });
});
