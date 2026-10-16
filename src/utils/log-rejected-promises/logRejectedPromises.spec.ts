import { logRejectedPromises } from './logRejectedPromises.js';

describe('logRejectedPromises', () => {
  it('should handle the error for each failed changelog generation', () => {
    const ERROR_MESSAGE = 'A package release failed.';
    const ERROR_ONE = new Error('Failed to generate changelog');
    const ERROR_TWO = new Error('Failed to generate changelog again');
    const onError = vi.fn();
    const generateChangelogVersionedResults: PromiseSettledResult<void>[] = [
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

    logRejectedPromises(generateChangelogVersionedResults, onError, ERROR_MESSAGE);

    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenNthCalledWith(1, ERROR_MESSAGE, { error: ERROR_ONE });
    expect(onError).toHaveBeenNthCalledWith(2, ERROR_MESSAGE, { error: ERROR_TWO });
  });

  it('should not call the error handler when all generations succeed', () => {
    const onError = vi.fn();

    logRejectedPromises([
      {
        status: 'fulfilled',
        value: undefined,
      },
    ], onError, 'some error message');

    expect(onError).not.toHaveBeenCalled();
  });
});
