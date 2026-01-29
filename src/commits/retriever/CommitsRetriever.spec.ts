import { execFileSync } from 'node:child_process';
import { CommitsRetriever, type RawCommits } from './CommitsRetriever.js';

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
  describe('getRawCommits', () => {
    let rawCommitsIterator: RawCommits;
    beforeEach(() => {
      rawCommitsIterator = new CommitsRetriever().getRawCommits();
    });

    it('should parse a single commit', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: add feature\x00c123||feat: ad\x00' });

      const commit = rawCommitsIterator.next().value;
      expect(commit).toStrictEqual(
        { hash: 'abc123', commit: 'feat: add feature' },
      );
    });

    it('should parse multiple commits', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: add feature\x00def456||fix: bug fix\x00' });

      const firstCommit = rawCommitsIterator.next().value;
      const secondCommit = rawCommitsIterator.next().value;
      expect(firstCommit).toStrictEqual(
        { hash: 'abc123', commit: 'feat: add feature' },
      );
      expect(secondCommit).toStrictEqual(
        { hash: 'def456', commit: 'fix: bug fix' },
      );
    });

    it('should handle a commit commit containing a delimiter', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: something || with pipes\x00' });

      expect(rawCommitsIterator.next().value).toStrictEqual(
        { hash: 'abc123', commit: 'feat: something || with pipes' },
      );
    });

    it('should handle a multiline commit commit', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: add feature\n\nThis is the commit.\x00' });

      expect(rawCommitsIterator.next().value).toStrictEqual(
        { hash: 'abc123', commit: 'feat: add feature\n\nThis is the commit.' },
      );
    });

    it('should skip empty entries', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: one\x00\x00def456||feat: two\x00 \x00' });

      const firstIterationResult = rawCommitsIterator.next();
      expect(firstIterationResult.done).toBe(false);
      expect(firstIterationResult.value).toStrictEqual(
        { hash: 'abc123', commit: 'feat: one' },
      );

      const secondIterationResult = rawCommitsIterator.next();
      expect(secondIterationResult.done).toBe(false);
      expect(secondIterationResult.value).toStrictEqual(
        { hash: 'def456', commit: 'feat: two' },
      );

      const thirdIterationResult = rawCommitsIterator.next();
      expect(thirdIterationResult.done).toBe(true);
    });

    it('should return an empty array when git log fails', () => {
      setupMocks({ rawCommitsString: new Error('git error') });

      expect(rawCommitsIterator.next().value).toBeUndefined();
    });
  });

  describe('commit range', () => {
    it('use the from..to range when from provided', () => {
      mockExecFileSync.mockReturnValue('');

      new CommitsRetriever({ from: 'v1.0.0', to: 'v2.0.0' }).getRawCommits().next();

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['v1.0.0..v2.0.0']),
        { encoding: 'utf-8' },
      );
    });

    it('should use the latest tag when from is not specified', () => {
      setupMocks();

      new CommitsRetriever({ to: 'HEAD' }).getRawCommits().next();

      expect(mockExecFileSync).toHaveBeenLastCalledWith(
        'git',
        expect.arrayContaining(['v1.0.0..HEAD']),
        { encoding: 'utf-8' },
      );
    });

    it('should return all commits when no tags exist', () => {
      setupMocks({ latestTag: new Error('no tags') });

      new CommitsRetriever({ to: 'HEAD' }).getRawCommits().next();

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

      new CommitsRetriever({ to: 'HEAD' }).getRawCommits().next();

      expect(mockExecFileSync).toHaveBeenNthCalledWith(
        2,
        'git',
        ['describe', '--tags', '--abbrev=0', 'origin/HEAD'],
        { encoding: 'utf-8' },
      );
    });
  });
});
