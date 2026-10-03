import { BASE_PARSED_COMMIT } from './base/BaseCommitsValidator.spec.js';
import { CommitsValidator } from './CommitsValidator.js';

describe('CommitsValidator', () => {
  it('should validate commits with default allowed types', () => {
    const onError = vi.fn();
    const validCommit = {
      ...BASE_PARSED_COMMIT,
      type: 'feat',
    };
    const invalidCommit = {
      ...BASE_PARSED_COMMIT,
      type: 'invalidType',
    };

    const commitsValidator = new CommitsValidator({ onError });
    const result = [...commitsValidator.validateCommits([validCommit, invalidCommit])];

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual(validCommit);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
