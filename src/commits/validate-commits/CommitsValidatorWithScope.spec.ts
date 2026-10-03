import { BASE_PARSED_COMMIT } from './base/BaseCommitsValidator.spec.js';
import { CommitsValidatorWithScope } from './CommitsValidatorWithScope.js';

describe('CommitsValidatorWithScope', () => {
  it('should validate commits with allowed scopes', () => {
    const onError = vi.fn();
    const ALLOWED_SCOPE = 'packageOne';
    const ALLOWED_SCOPES = new Set([ALLOWED_SCOPE]);
    const validCommit = {
      ...BASE_PARSED_COMMIT,
      scope: ALLOWED_SCOPE,
    };
    const invalidCommit = {
      ...BASE_PARSED_COMMIT,
      scope: 'invalid',
    };

    const commitsValidator = new CommitsValidatorWithScope({
      allowedCommitScopes: ALLOWED_SCOPES,
      onError,
    });
    const result = [...commitsValidator.validateCommits([validCommit, invalidCommit])];

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual(validCommit);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
