import { execFileSync } from 'node:child_process';

import { CommitsRetriever } from './CommitsRetriever.js';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}));

const mockExecFileSync = vi.mocked(execFileSync);

type MockValue = string | Error;

function setupMocks({
  symbolicRef = 'origin/main',
  latestTag = 'v1.0.0',
  rawCommitsString = '',
}: {
  symbolicRef?: MockValue;
  latestTag?: MockValue;
  rawCommitsString?: MockValue;
} = {}) {
  for (const value of [symbolicRef, latestTag, rawCommitsString]) {
    if (value instanceof Error) {
      mockExecFileSync.mockRejectedValueOnce(value);
    } else {
      mockExecFileSync.mockReturnValueOnce(value);
    }
  }
}

describe('CommitsRetriever', () => {
  beforeAll(() => {
    console.error = vi.fn(); // Prevent console.errors from clogging unit test output
  });

  describe('getRawCommits', () => {
    it('should parse a single commit', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: add feature\x00c123||feat: ad\x00' });

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits[0]).toStrictEqual(
        { hash: 'abc123', commit: 'feat: add feature' },
      );
    });

    it('should parse multiple commits', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: add feature\x00def456||fix: bug fix\x00' });

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits).toHaveLength(2);
      expect(rawCommits[0]).toStrictEqual(
        { hash: 'abc123', commit: 'feat: add feature' },
      );
      expect(rawCommits[1]).toStrictEqual(
        { hash: 'def456', commit: 'fix: bug fix' },
      );
    });

    it('should handle a commit commit containing a delimiter', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: something || with pipes\x00' });

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits[0]).toStrictEqual(
        { hash: 'abc123', commit: 'feat: something || with pipes' },
      );
    });

    it('should handle a multiline commit commit', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: add feature\n\nThis is the commit.\x00' });

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits[0]).toStrictEqual(
        { hash: 'abc123', commit: 'feat: add feature\n\nThis is the commit.' },
      );
    });

    it('should skip empty entries', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: one\x00\x00def456||feat: two\x00 \x00' });

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits).toHaveLength(2);
      expect(rawCommits[0]).toStrictEqual(
        { hash: 'abc123', commit: 'feat: one' },
      );
      expect(rawCommits[1]).toStrictEqual(
        { hash: 'def456', commit: 'feat: two' },
      );
    });

    it('should return an empty array when git log fails', () => {
      setupMocks({ rawCommitsString: new Error('git error') });

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits).toHaveLength(0);
    });
  });

  describe('commit range', () => {
    it('use the from..to range when from provided', () => {
      mockExecFileSync.mockReturnValue('');

      const _ = [...new CommitsRetriever({ from: 'v1.0.0', to: 'v2.0.0' }).getRawCommits()];

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['v1.0.0..v2.0.0']),
        { encoding: 'utf-8' },
      );
    });

    it('should use the latest tag when from is not specified', () => {
      setupMocks();

      const _ =[...new CommitsRetriever({ to: 'HEAD' }).getRawCommits()];

      expect(mockExecFileSync).toHaveBeenLastCalledWith(
        'git',
        expect.arrayContaining(['v1.0.0..HEAD']),
        { encoding: 'utf-8' },
      );
    });

    it('should return all commits when no tags exist', () => {
      setupMocks({ latestTag: new Error('no tags') });

      const _ =[...new CommitsRetriever({ to: 'HEAD' }).getRawCommits()];

      expect(mockExecFileSync).toHaveBeenLastCalledWith(
        'git',
        expect.arrayContaining(['HEAD']),
        { encoding: 'utf-8' },
      );
    });
  });

  describe('getDefaultBranch', () => {
    it('falls back to origin/HEAD when it cannot find a remote branch', () => {
      setupMocks({
        symbolicRef: new Error('no remote'),
        latestTag: new Error('no tags'),
      });

      const _ =[...new CommitsRetriever({ to: 'HEAD' }).getRawCommits()];

      expect(mockExecFileSync).toHaveBeenNthCalledWith(
        2,
        'git',
        ['describe', '--tags', '--abbrev=0', 'origin/HEAD'],
        { encoding: 'utf-8' },
      );
    });
  });
});
