import { BASE_PARSED_COMMIT } from './base/BaseCommitsValidator.spec.js';
import { CommitsValidatorWithType } from './CommitsValidatorWithType.js';

describe('CommitsValidatorWithType', () => {
  it('should validate commits with allowed types', () => {
    const onError = vi.fn();
    const ALLOWED_TYPE = 'some-unusual-type';
    const ALLOWED_TYPES = new Set([ALLOWED_TYPE]);
    const validCommit = {
      ...BASE_PARSED_COMMIT,
      type: ALLOWED_TYPE,
    };
    const invalidCommit = {
      ...BASE_PARSED_COMMIT,
      type: 'invalid',
    };

    const commitsValidator = new CommitsValidatorWithType({
      allowedCommitTypes: ALLOWED_TYPES,
      onError,
    });
    const result = [...commitsValidator.validateCommits([validCommit, invalidCommit])];

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual(validCommit);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
