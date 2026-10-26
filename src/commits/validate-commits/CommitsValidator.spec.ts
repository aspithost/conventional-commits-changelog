import { ZodError } from 'zod';

import type { ParsedCommit } from '../parse-commits/CommitsParser.js';

import { CommitsValidator } from './CommitsValidator.js';

const { safeParse } = vi.hoisted(() => ({
  safeParse: vi.fn(),
}));

vi.mock('./schemas/commit.js', () => ({
  commitSchema: { safeParse },
}));

const FIRST_COMMIT = {
  hash: 'abc123',
  scope: 'package-one',
  type: 'feat',
} as unknown as ParsedCommit;
const SECOND_COMMIT = {
  hash: 'def456',
  scope: 'package-two',
  type: 'fix',
} as unknown as ParsedCommit;
const COMMITS = [FIRST_COMMIT, SECOND_COMMIT];

describe('CommitsValidator', () => {
  const onError = vi.fn();

  it('should validate each commit against the commits schema', () => {
    safeParse.mockImplementation((commit: ParsedCommit) => ({
      success: true,
      data: commit,
    }));

    const validatedCommits = [...new CommitsValidator({ onError }).getValidatedCommits(COMMITS)];

    expect(validatedCommits).toStrictEqual(COMMITS);
    expect(safeParse).toHaveBeenCalledTimes(2);
    expect(safeParse).toHaveBeenNthCalledWith(1, FIRST_COMMIT);
    expect(safeParse).toHaveBeenNthCalledWith(2, SECOND_COMMIT);
    expect(onError).not.toHaveBeenCalled();
  });

  describe('error handling', () => {
    it('should log a validation error for each failed validation', () => {
      const firstError = new ZodError([]);
      const secondError = new ZodError([]);
      safeParse
        .mockReturnValueOnce({
          success: false,
          error: firstError,
        })
        .mockReturnValueOnce({
          success: false,
          error: secondError,
        });

      const validatedCommits = [...new CommitsValidator({ onError }).getValidatedCommits(COMMITS)];

      expect(validatedCommits).toHaveLength(0);
      expect(safeParse).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenNthCalledWith(
        1,
        'Validation error, did not yield commit',
        firstError,
      );
      expect(onError).toHaveBeenNthCalledWith(
        2,
        'Validation error, did not yield commit',
        secondError,
      );
    });

    it('should continue validating commits after a failed validation', () => {
      const validationError = new ZodError([]);
      safeParse
        .mockReturnValueOnce({
          success: false,
          error: validationError,
        })
        .mockReturnValueOnce({
          success: true,
          data: SECOND_COMMIT,
        });

      const validatedCommits = [...new CommitsValidator({ onError }).getValidatedCommits(COMMITS)];

      expect(validatedCommits).toStrictEqual([SECOND_COMMIT]);
      expect(safeParse).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledExactlyOnceWith(
        'Validation error, did not yield commit',
        validationError,
      );
    });
  });
});
