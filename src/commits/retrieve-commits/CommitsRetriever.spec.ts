import { _execFileSync } from '../../utils/node/execFileSync.js';

import { COMMIT_FORMAT, CommitsRetriever } from './CommitsRetriever.js';

vi.mock('../../utils/node/execFileSync.js', () => ({
  _execFileSync: vi.fn(),
}));

const mockExecFileSync = vi.mocked(_execFileSync);

vi.mock('@/shared/error/logError.js');

type MockValue = string | Error;
function setupMocks({
  remoteSymbolicRef = 'refs/remotes/origin/main',
  latestTag = 'v1.0.0',
  rawCommitsString = '',
}: {
  remoteSymbolicRef?: MockValue;
  latestTag?: MockValue;
  rawCommitsString?: MockValue;
} = {}) {
  for (const value of [
    remoteSymbolicRef,
    latestTag,
    rawCommitsString,
  ]) {
    if (value instanceof Error) {
      mockExecFileSync.mockImplementationOnce(() => {
        throw value;
      });
    } else {
      mockExecFileSync.mockReturnValueOnce(value);
    }
  }
}

const mockOnError = vi.fn();

describe('CommitsRetriever', () => {
  describe('constructor', () => {
    it('should validate the input of "from", "to" and "remoteSymbolicRef"', () => {
      expect(() => new CommitsRetriever({
        from: 'v1.0.0',
        to: 'v2.0.0',
        remoteSymbolicRef: 'refs/remotes/origin/main',
      })).not.toThrow();
      expect(() => new CommitsRetriever({
        from: '--some-flag',
        to: 'v2.0.0',
        remoteSymbolicRef: 'refs/remotes/origin/main',
      })).toThrow(expect.objectContaining({ message: 'Invalid commits retriever options.' }));
      expect(() => new CommitsRetriever({
        from: 'v1.0.0',
        to: '--some-flag',
        remoteSymbolicRef: 'refs/remotes/origin/main',
      })).toThrow(expect.objectContaining({ message: 'Invalid commits retriever options.' }));
      expect(() => new CommitsRetriever({
        from: 'v1.0.0',
        to: 'v2.0.0',
        remoteSymbolicRef: '--some-flag',
      })).toThrow(expect.objectContaining({ message: 'Invalid commits retriever options.' }));
    });

    it('should allow values that merely contain a dash, or are empty', () => {
      expect(() => new CommitsRetriever({
        from: 'feature-branch',
        to: 'v2.0.0',
      })).not.toThrow();
      expect(() => new CommitsRetriever({
        from: '',
        to: 'v2.0.0',
      })).not.toThrow();
    });
  });

  describe('getRawCommits', () => {
    it('should parse a single commit', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: add feature\x00c123||feat: ad\x00' });

      const rawCommits = [...new CommitsRetriever({ onError: mockOnError }).getRawCommits()];

      expect(rawCommits[0]).toStrictEqual(
        {
          hash: 'abc123',
          commit: 'feat: add feature',
        },
      );
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should parse multiple commits', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: add feature\x00def456||fix: bug fix\x00' });

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits).toHaveLength(2);
      expect(rawCommits[0]).toStrictEqual(
        {
          hash: 'abc123',
          commit: 'feat: add feature',
        },
      );
      expect(rawCommits[1]).toStrictEqual(
        {
          hash: 'def456',
          commit: 'fix: bug fix',
        },
      );
    });

    it('should handle a commit commit containing a delimiter', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: something || with pipes\x00' });

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits[0]).toStrictEqual(
        {
          hash: 'abc123',
          commit: 'feat: something || with pipes',
        },
      );
    });

    it('should handle a multiline commit', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: add feature\n\nThis is the commit.\x00' });

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits[0]).toStrictEqual(
        {
          hash: 'abc123',
          commit: 'feat: add feature\n\nThis is the commit.',
        },
      );
    });

    it('should skip empty entries', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: one\x00\x00def456||feat: two\x00 \x00' });

      const rawCommits = [...new CommitsRetriever({ onError: mockOnError }).getRawCommits()];

      expect(rawCommits).toHaveLength(2);
      expect(rawCommits[0]).toStrictEqual(
        {
          hash: 'abc123',
          commit: 'feat: one',
        },
      );
      expect(rawCommits[1]).toStrictEqual(
        {
          hash: 'def456',
          commit: 'feat: two',
        },
      );
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should return an empty array when git log fails', () => {
      const GIT_ERROR = new Error('git error');
      setupMocks({ rawCommitsString: GIT_ERROR });

      expect(() => Array.from(new CommitsRetriever().getRawCommits())).toThrow();
    });
  });

  describe('getRawCommitsString', () => {
    it('should retrieve a formatted string of commits', () => {
      setupMocks({ rawCommitsString: 'abc123||feat: add feature\x00' });

      const _ = [...new CommitsRetriever({ onError: mockOnError }).getRawCommits()];

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining([`--pretty=format:${COMMIT_FORMAT}`]),
        process.cwd(),
      );
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('commitRange', () => {
    it('use the from..to range when the user provides the form param', () => {
      mockExecFileSync.mockReturnValue('');

      const _ = [
        ...new CommitsRetriever({
          from: 'v1.0.0',
          to: 'v2.0.0',
          onError: mockOnError,
        }).getRawCommits(),
      ];

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['v1.0.0..v2.0.0']),
        process.cwd(),
      );
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should return the full history if the user specifies from as null', () => {
      mockExecFileSync.mockReturnValue('');

      const _ = [
        ...new CommitsRetriever({
          from: null,
          to: 'v1.0.0',
          onError: mockOnError,
        }).getRawCommits(),
      ];

      expect(mockExecFileSync).toHaveBeenCalledTimes(1);
      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['v1.0.0']),
        process.cwd(),
      );
    });

    it('should return all commits when no tags exist', () => {
      console.error = vi.fn();
      setupMocks({ latestTag: new Error('no tags') });

      const _ =[...new CommitsRetriever({ to: 'HEAD' }).getRawCommits()];

      expect(mockExecFileSync).toHaveBeenLastCalledWith(
        'git',
        expect.arrayContaining(['HEAD']),
        process.cwd(),
      );
    });
  });

  describe('getLatestTag', () => {
    it('should use the latest tag when from is not specified', () => {
      setupMocks();

      const _ =[...new CommitsRetriever({ to: 'HEAD' }).getRawCommits()];

      expect(mockExecFileSync).toHaveBeenLastCalledWith(
        'git',
        expect.arrayContaining(['v1.0.0..HEAD']),
        process.cwd(),
      );
    });

    it('should return null when no tags exist', () => {
      setupMocks({ latestTag: new Error('no tags found') });

      const _ =[...new CommitsRetriever().getRawCommits()];

      expect(mockExecFileSync).toHaveBeenLastCalledWith(
        'git',
        expect.arrayContaining(['HEAD']),
        process.cwd(),
      );
    });
  });

  describe('getDefaultBranch', () => {
    it('should use the the custom releaseBranch and cwd if provided', () => {
      const REMOTE_FEATURE_BRANCH = 'refs/remotes/origin/some-feature';
      const CWD_PATH = '/some/path';
      setupMocks({ remoteSymbolicRef: REMOTE_FEATURE_BRANCH });

      const _ =[
        ...new CommitsRetriever({
          cwd: CWD_PATH,
          remoteSymbolicRef: REMOTE_FEATURE_BRANCH,
          onError: mockOnError,
        }).getRawCommits(),
      ];

      expect(mockExecFileSync).toHaveBeenNthCalledWith(
        1,
        'git',
        ['symbolic-ref', REMOTE_FEATURE_BRANCH],
        CWD_PATH,
      );
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('falls back to origin/main when it cannot find a remote branch', () => {
      const BRANCH_ERROR = new Error('no remote');
      const TAG_ERROR = new Error('no tags');
      setupMocks({
        remoteSymbolicRef: BRANCH_ERROR,
        latestTag: TAG_ERROR,
      });

      const _ =[...new CommitsRetriever({ onError: mockOnError }).getRawCommits()];

      expect(mockExecFileSync).toHaveBeenNthCalledWith(
        2,
        'git',
        [
          'describe',
          '--tags',
          '--abbrev=0',
          'origin/main',
        ],
        process.cwd(),
      );
      expect(mockOnError).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('WARN: No remote symbolic reference found'),
        BRANCH_ERROR,
      );
      expect(mockOnError).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('WARN: no tags found on remote branch.'),
        TAG_ERROR,
      );
    });
  });
});
