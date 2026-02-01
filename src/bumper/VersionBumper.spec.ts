import type { ValidatedCommit, ValidatedCommits } from '@/commits/validator/CommitsValidator.js';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { VersionBumper } from './versionBumper.js';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

const mockExecFileSync = vi.mocked(execFileSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);

function* createValidatedCommits(commits: ValidatedCommit<string, string>[]): ValidatedCommits<string, string> {
  for (const commit of commits) {
    yield commit;
  }
}

const VALIDATED_COMMIT = {
  hash: 'abc123',
  merge: null,
  revert: null,
  header: 'feat(core): add feature',
  body: null,
  footer: null,
  notes: [],
  mentions: [],
  references: [],
  scope: 'core',
  type: 'feat',
  subject: 'add feature',
} satisfies ValidatedCommit<string, string>;

describe('VersionBumper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecFileSync.mockReturnValue('v1.1.0\n');
    mockReadFileSync.mockReturnValue('# Package\n\nVersion: 1.0.0\n');
  });

  describe('bumpVersion', () => {
    describe('release type determination', () => {
      it('should return major for commits with BREAKING CHANGE note', () => {
        const commits = createValidatedCommits([
          { ...BASE_COMMIT, notes: [{ title: 'BREAKING CHANGE', text: 'removed old API' }] },
        ]);

        const result = VersionBumper.bumpVersion('/path/to/package', commits);

        expect(result?.releaseType).toBe('major');
      });

      it('should return major for commits with BREAKING-CHANGE note (hyphenated)', () => {
        const commits = createValidatedCommits([
          { ...BASE_COMMIT, notes: [{ title: 'BREAKING-CHANGE', text: 'removed old API' }] },
        ]);

        const result = VersionBumper.bumpVersion('/path/to/package', commits);

        expect(result?.releaseType).toBe('major');
      });

      it('should return minor for feat commits', () => {
        const commits = createValidatedCommits([
          { ...BASE_COMMIT, type: 'feat' },
        ]);

        const result = VersionBumper.bumpVersion('/path/to/package', commits);

        expect(result?.releaseType).toBe('minor');
      });

      it('should return patch for fix commits', () => {
        const commits = createValidatedCommits([
          { ...BASE_COMMIT, type: 'fix' },
        ]);

        const result = VersionBumper.bumpVersion('/path/to/package', commits);

        expect(result?.releaseType).toBe('patch');
      });

      it('should return minor when both feat and fix commits are present', () => {
        const commits = createValidatedCommits([
          { ...BASE_COMMIT, type: 'fix' },
          { ...BASE_COMMIT, type: 'feat' },
        ]);

        const result = VersionBumper.bumpVersion('/path/to/package', commits);

        expect(result?.releaseType).toBe('minor');
      });

      it('should return major when breaking change and feat are present', () => {
        const commits = createValidatedCommits([
          { ...BASE_COMMIT, type: 'feat' },
          { ...BASE_COMMIT, notes: [{ title: 'BREAKING CHANGE', text: 'breaking' }] },
        ]);

        const result = VersionBumper.bumpVersion('/path/to/package', commits);

        expect(result?.releaseType).toBe('major');
      });

      it('should return undefined for commits with non-bumping types', () => {
        const commits = createValidatedCommits([
          { ...BASE_COMMIT, type: 'docs' },
          { ...BASE_COMMIT, type: 'chore' },
        ]);

        const result = VersionBumper.bumpVersion('/path/to/package', commits);

        expect(result).toBeUndefined();
      });

      it('should return undefined for empty commits', () => {
        const commits = createValidatedCommits([]);

        const result = VersionBumper.bumpVersion('/path/to/package', commits);

        expect(result).toBeUndefined();
      });
    });

    describe('npm version execution', () => {
      it('should call npm version with correct arguments', () => {
        const commits = createValidatedCommits([{ ...BASE_COMMIT, type: 'feat' }]);

        VersionBumper.bumpVersion('/path/to/package', commits);

        expect(mockExecFileSync).toHaveBeenCalledWith(
          'npm',
          ['version', 'minor', '--no-git-tag-version'],
          { cwd: '/path/to/package', encoding: 'utf-8' },
        );
      });

      it('should return the bumped version without v prefix', () => {
        mockExecFileSync.mockReturnValue('v2.0.0\n');
        const commits = createValidatedCommits([
          { ...BASE_COMMIT, notes: [{ title: 'BREAKING CHANGE', text: 'breaking' }] },
        ]);

        const result = VersionBumper.bumpVersion('/path/to/package', commits);

        expect(result?.version).toBe('2.0.0');
      });
    });

    describe('dry run', () => {
      it('should not call npm version when dryRun is true', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const commits = createValidatedCommits([{ ...BASE_COMMIT, type: 'feat' }]);

        VersionBumper.bumpVersion('/path/to/package', commits, { dryRun: true });

        expect(mockExecFileSync).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
      });

      it('should log dry run message', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const commits = createValidatedCommits([{ ...BASE_COMMIT, type: 'feat' }]);

        VersionBumper.bumpVersion('/path/to/package', commits, { dryRun: true });

        expect(consoleSpy).toHaveBeenCalledWith(
          '[dry-run] Would bump /path/to/package with release type minor.',
        );
        consoleSpy.mockRestore();
      });

      it('should return undefined when dryRun is true', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const commits = createValidatedCommits([{ ...BASE_COMMIT, type: 'feat' }]);

        const result = VersionBumper.bumpVersion('/path/to/package', commits, { dryRun: true });

        expect(result).toBeUndefined();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('updateReadme', () => {
    const packagePath = join('path', 'to', 'package');
    const readmePath = join(packagePath, 'README.md');

    it('should update README with new version by default', () => {
      mockExecFileSync.mockReturnValue('v1.2.0\n');
      const commits = createValidatedCommits([{ ...BASE_COMMIT, type: 'feat' }]);

      VersionBumper.bumpVersion(packagePath, commits);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        readmePath,
        '# Package\n\nVersion: 1.2.0\n',
        'utf-8',
      );
    });

    it('should not update README when updateReadme is false', () => {
      const commits = createValidatedCommits([{ ...BASE_COMMIT, type: 'feat' }]);

      VersionBumper.bumpVersion(packagePath, commits, { updateReadme: false });

      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it('should replace first semver match in README', () => {
      mockExecFileSync.mockReturnValue('v2.0.0\n');
      mockReadFileSync.mockReturnValue('Version 1.0.0 - depends on lib 3.4.5');
      const commits = createValidatedCommits([
        { ...BASE_COMMIT, notes: [{ title: 'BREAKING CHANGE', text: 'breaking' }] },
      ]);

      VersionBumper.bumpVersion(packagePath, commits);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        readmePath,
        'Version 2.0.0 - depends on lib 3.4.5',
        'utf-8',
      );
    });
  });

  describe('error handling', () => {
    it('should throw and log error when npm version fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockExecFileSync.mockImplementation(() => {
        throw new Error('npm error');
      });
      const commits = createValidatedCommits([{ ...BASE_COMMIT, type: 'feat' }]);

      expect(() => VersionBumper.bumpVersion('/path/to/package', commits)).toThrow('npm error');
      expect(consoleSpy).toHaveBeenCalledWith('Error bumping version in folder path: /path/to/package');
      consoleSpy.mockRestore();
    });

    it('should throw and log error when README update fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('write error');
      });
      const commits = createValidatedCommits([{ ...BASE_COMMIT, type: 'feat' }]);

      expect(() => VersionBumper.bumpVersion('/path/to/package', commits)).toThrow('write error');
      expect(consoleSpy).toHaveBeenCalledWith('Error bumping README.md in folder: /path/to/package');
      consoleSpy.mockRestore();
    });
  });
});
