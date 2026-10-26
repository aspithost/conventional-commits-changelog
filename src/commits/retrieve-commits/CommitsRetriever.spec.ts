import { execFileSyncWrapper } from '../../utils/node/execFileSync.js';

import { COMMIT_FORMAT, CommitsRetriever } from './CommitsRetriever.js';

vi.mock('../../utils/node/execFileSync.js', () => ({
  execFileSyncWrapper: vi.fn(),
}));

vi.mock('@/shared/error/logError.js');

const mockOnError = vi.fn();

describe('CommitsRetriever', () => {
  describe('constructor', () => {
    it('should validate the input of "from" and "to"', () => {
      expect(() => new CommitsRetriever({
        from: 'v1.0.0',
        to: 'v2.0.0',
      })).not.toThrow();
      expect(() => new CommitsRetriever({
        from: 'feature-branch',
        to: 'v2.0.0',
      })).not.toThrow();
      expect(() => new CommitsRetriever({
        from: '--some-flag',
        to: 'v2.0.0',
      })).toThrow(expect.objectContaining({ message: 'Invalid CommitsRetriever options.' }));
      expect(() => new CommitsRetriever({
        from: 'v1.0.0',
        to: '--some-flag',
      })).toThrow(expect.objectContaining({ message: 'Invalid CommitsRetriever options.' }));
    });
  });

  describe('getRawCommits', () => {
    it('should parse a single commit', () => {
      vi.mocked(execFileSyncWrapper)
        .mockReturnValueOnce('abc123||feat: add feature\x00c123||feat: ad\x00');

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
      vi.mocked(execFileSyncWrapper)
        .mockReturnValueOnce('abc123||feat: add feature\x00def456||fix: bug fix\x00');

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

    it('should handle a commit containing a delimiter', () => {
      vi.mocked(execFileSyncWrapper)
        .mockReturnValueOnce('abc123||feat: something || with pipes\x00');

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits[0]).toStrictEqual(
        {
          hash: 'abc123',
          commit: 'feat: something || with pipes',
        },
      );
    });

    it('should handle a multiline commit', () => {
      vi.mocked(execFileSyncWrapper)
        .mockReturnValueOnce('abc123||feat: add feature\n\nThis is the commit.\x00');

      const rawCommits = [...new CommitsRetriever().getRawCommits()];

      expect(rawCommits[0]).toStrictEqual(
        {
          hash: 'abc123',
          commit: 'feat: add feature\n\nThis is the commit.',
        },
      );
    });

    it('should skip empty entries', () => {
      vi.mocked(execFileSyncWrapper)
        .mockReturnValueOnce('abc123||feat: one\x00\x00def456||feat: two\x00 \x00');

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
      vi.mocked(execFileSyncWrapper)
        .mockImplementationOnce(() => {
          throw GIT_ERROR;
        });

      expect(() => Array.from(new CommitsRetriever().getRawCommits())).toThrow();
    });
  });

  describe('getRawCommitsString', () => {
    it('should retrieve a formatted string of commits', () => {
      vi.mocked(execFileSyncWrapper)
        .mockReturnValueOnce('abc123||feat: add feature\x00');

      const _ = [...new CommitsRetriever({ onError: mockOnError }).getRawCommits()];

      expect(execFileSyncWrapper).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining([`--pretty=format:${COMMIT_FORMAT}`]),
        process.cwd(),
      );
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('commitRange', () => {
    it('should use the from..to range when the user provides the from param', () => {
      vi.mocked(execFileSyncWrapper)
        .mockReturnValueOnce('');

      const _ = [
        ...new CommitsRetriever({
          from: 'v1.0.0',
          to: 'v2.0.0',
          onError: mockOnError,
        }).getRawCommits(),
      ];

      expect(execFileSyncWrapper).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['v1.0.0..v2.0.0']),
        process.cwd(),
      );
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should return the full history if the user specifies from as null', () => {
      vi.mocked(execFileSyncWrapper).mockReturnValue('');

      const _ = [
        ...new CommitsRetriever({
          from: null,
          to: 'v1.0.0',
          onError: mockOnError,
        }).getRawCommits(),
      ];

      expect(execFileSyncWrapper).toHaveBeenCalledTimes(1);
      expect(execFileSyncWrapper).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['v1.0.0']),
        process.cwd(),
      );
    });
  });
});
