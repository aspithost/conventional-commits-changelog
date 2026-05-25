import type { ParsedCommit, ParsedCommits } from '../parse-commits/CommitsParser.js';
import { validateCommits } from './validateCommits.js';

const ALLOWED_SCOPES = ['packageOne', 'packageTwo'] as const;
const ALLOWED_TYPES = ['feat', 'fix', 'chore'] as const;

const BASE_COMMIT_HASH = 'abc123';
const BASE_PARSED_COMMIT = {
  hash: BASE_COMMIT_HASH,
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

function* createParsedCommits(commits: ParsedCommit[]): ParsedCommits {
  yield* commits;
}

describe('validateCommits', () => {
  beforeAll(() => {
    console.error = vi.fn();
  });

  describe('options', () => {
    it('should validate commits using default allowed types when no options are passed', () => {
      const parsedCommits = createParsedCommits([BASE_PARSED_COMMIT]);

      const result = [...validateCommits(parsedCommits)];

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ hash: BASE_COMMIT_HASH, type: 'feat' });
    });

    it('should not include commits whose type is not in the default allowed types', () => {
      const parsedCommits = createParsedCommits([
        { ...BASE_PARSED_COMMIT, type: 'unknown-type' },
      ]);

      const result = [...validateCommits(parsedCommits)];

      expect(result).toHaveLength(0);
    });

    it('should validate commits against provided allowedTypes only', () => {
      const parsedCommits = createParsedCommits([
        BASE_PARSED_COMMIT,
        { ...BASE_PARSED_COMMIT, hash: 'def456', type: 'chore' },
        { ...BASE_PARSED_COMMIT, hash: 'ghi789', type: 'docs' },
      ]);

      const result = [...validateCommits(parsedCommits, { allowedTypes: ['feat', 'chore'] })];

      expect(result).toHaveLength(2);
      expect(result[0].hash).toBe(BASE_COMMIT_HASH);
      expect(result[1].hash).toBe('def456');
    });

    it('should validate commits against provided allowedScopes and default types', () => {
      const parsedCommits = createParsedCommits([
        BASE_PARSED_COMMIT,
        { ...BASE_PARSED_COMMIT, hash: 'def456', scope: 'packageTwo' },
        { ...BASE_PARSED_COMMIT, hash: 'ghi789', scope: 'invalid-scope' },
      ]);

      const result = [...validateCommits(parsedCommits, { allowedScopes: ALLOWED_SCOPES })];

      expect(result).toHaveLength(2);
      expect(result[0].hash).toBe(BASE_COMMIT_HASH);
      expect(result[1].hash).toBe('def456');
    });

    it('should validate commits against both allowedScopes and allowedTypes', () => {
      const parsedCommits = createParsedCommits([
        BASE_PARSED_COMMIT,
        { ...BASE_PARSED_COMMIT, hash: 'def456', scope: 'invalid-scope' },
        { ...BASE_PARSED_COMMIT, hash: 'ghi789', type: 'docs' },
        { ...BASE_PARSED_COMMIT, hash: 'jkl012', scope: 'packageTwo', type: 'chore' },
      ]);

      const result = [...validateCommits(parsedCommits, {
        allowedScopes: ALLOWED_SCOPES,
        allowedTypes: ALLOWED_TYPES,
      })];

      expect(result).toHaveLength(2);
      expect(result[0].hash).toBe(BASE_COMMIT_HASH);
      expect(result[1].hash).toBe('jkl012' );
    });
  });

  describe('commit validation', () => {
    it('should yield a valid commit', () => {
      const parsedCommits = createParsedCommits([BASE_PARSED_COMMIT]);

      const result = [...validateCommits(parsedCommits, {
        allowedScopes: ALLOWED_SCOPES,
        allowedTypes: ALLOWED_TYPES,
      })];

      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual(BASE_PARSED_COMMIT);
    });

    it('should not yield commits with an invalid scope', () => {
      const parsedCommits = createParsedCommits([
        { ...BASE_PARSED_COMMIT, scope: 'invalid-scope' },
      ]);

      const result = [...validateCommits(parsedCommits, {
        allowedScopes: ALLOWED_SCOPES,
        allowedTypes: ALLOWED_TYPES,
      })];

      expect(result).toHaveLength(0);
    });

    it('should not yield commits with an invalid type', () => {
      const parsedCommits = createParsedCommits([
        { ...BASE_PARSED_COMMIT, type: 'invalid-type' },
      ]);

      const result = [...validateCommits(parsedCommits, {
        allowedScopes: ALLOWED_SCOPES,
        allowedTypes: ALLOWED_TYPES,
      })];

      expect(result).toHaveLength(0);
    });

    it('should not yield commits for empty input', () => {
      const parsedCommits = createParsedCommits([]);

      const result = [...validateCommits(parsedCommits, {
        allowedScopes: ALLOWED_SCOPES,
        allowedTypes: ALLOWED_TYPES,
      })];

      expect(result).toHaveLength(0);
    });

    it('should only yield commits with a valid scope and type, if specified', () => {
      const parsedCommits = createParsedCommits([
        BASE_PARSED_COMMIT,
        { ...BASE_PARSED_COMMIT, hash: 'def456', scope: 'invalid-scope' },
        { ...BASE_PARSED_COMMIT, hash: 'ghi789', type: 'fix' },
      ]);

      const result = [...validateCommits(parsedCommits, {
        allowedScopes: ALLOWED_SCOPES,
        allowedTypes: ALLOWED_TYPES,
      })];

      expect(result).toHaveLength(2);
      expect(result[0].hash).toBe(BASE_COMMIT_HASH);
      expect(result[1].hash).toBe('ghi789');
    });
  });
});
