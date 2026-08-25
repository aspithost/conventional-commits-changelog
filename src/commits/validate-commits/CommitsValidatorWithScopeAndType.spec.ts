import { BASE_PARSED_COMMIT } from './base/BaseCommitsValidator.spec.js';
import { CommitsValidatorWithScopeAndType } from './CommitsValidatorWithScopeAndType.js';

describe('CommitsValidatorWithScopeAndType', () => {
  it('should validate commits with allowed scopes and types', () => {
    const onError = vi.fn();
    const ALLOWED_SCOPE = 'packageOne';
    const ALLOWED_SCOPES = [ALLOWED_SCOPE];
    const ALLOWED_TYPE = 'some-unusual-type';
    const ALLOWED_TYPES = [ALLOWED_TYPE];
    const validCommit = { ...BASE_PARSED_COMMIT, scope: ALLOWED_SCOPE, type: ALLOWED_TYPE };
    const invalidCommitOne = { ...BASE_PARSED_COMMIT, scope: 'invalid', type: ALLOWED_TYPE };
    const invalidCommitTwo = { ...BASE_PARSED_COMMIT, scope: ALLOWED_SCOPE, type: 'invalid' };
    const invalidCommitThree = { ...BASE_PARSED_COMMIT, scope: 'invalid', type: 'invalid' };

    const commitsValidator = new CommitsValidatorWithScopeAndType({
      allowedCommitScopes: ALLOWED_SCOPES,
      allowedCommitTypes: ALLOWED_TYPES,
      onError,
    });
    const result = [...commitsValidator.validateCommits([
      validCommit,
      invalidCommitOne,
      invalidCommitTwo,
      invalidCommitThree,
    ])];

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual(validCommit);
    expect(onError).toHaveBeenCalledTimes(3);
  });
});
