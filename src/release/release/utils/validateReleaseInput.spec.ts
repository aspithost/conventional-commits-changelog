import type { BaseReleaseOptions } from '../schemas/releaseOptions.js';

import { validateReleaseInput } from './validateReleaseInput.js';

const VALID_OPTIONS: BaseReleaseOptions = {
  directoryPath: '/path/to/package',
  isDryRun: true,
  releaseType: 'minor',
};

describe('validateReleaseInput', () => {
  it('should not throw an error when the user provides valid release input parameters', () => {
    expect(() => { validateReleaseInput(VALID_OPTIONS); }).not.toThrow();
  });

  test.each([
    { releaseVersion: 'v1.2.3' },
    { releaseVersion: '1.2' },
    { releaseVersion: '1.2.3.4' },
    { releaseType: 'invalid' },
    { releaseType: 'patchhhh' },
  ])('should throw and error for invalid release input', (options) => {
    const INVALID_OPTIONS = {
      ...VALID_OPTIONS,
      ...options,
    };

    // @ts-expect-error: Invalid input for unit testing purposes
    expect(() => { validateReleaseInput(INVALID_OPTIONS); }).toThrow(
      expect.objectContaining({
        message: 'Validation error: invalid release options',
      }),
    );
  });
});
