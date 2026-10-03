import { handleReleasePackagesErrors } from './handleReleaseErrors.js';

describe('handleReleaseErrors', () => {
  it('should handle the error for each failed package release', () => {
    const ERROR_ONE = new Error('Package release failed');
    const ERROR_TWO = new Error('Another package release failed');
    const onError = vi.fn();
    const releasePackagesResults: PromiseSettledResult<void>[] = [
      {
        status: 'fulfilled',
        value: undefined,
      },
      {
        status: 'rejected',
        reason: ERROR_ONE,
      },
      {
        status: 'fulfilled',
        value: undefined,
      },
      {
        status: 'rejected',
        reason: ERROR_TWO,
      },
    ];

    handleReleasePackagesErrors(releasePackagesResults, onError);

    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenNthCalledWith(1, expect.any(String), { error: ERROR_ONE });
    expect(onError).toHaveBeenNthCalledWith(2, expect.any(String), { error: ERROR_TWO });
  });
});
