import type { CliReleaseOptions } from '../schemas/cliReleaseOptions.js';

import { validateReleaseArgs } from './validateReleaseArgs.js';

const VALID_OPTIONS: CliReleaseOptions = {
  directoryPath: '/path/to/package',
  isDryRun: true,
  isUpdateReadme: true,
  releaseType: 'minor',
  releaseVersion: '1.2.3',
};

describe('validateReleaseArgs', () => {
  it('should return the options when the user provides valid release parameters', () => {
    expect(validateReleaseArgs(VALID_OPTIONS)).toStrictEqual(VALID_OPTIONS);
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

    expect(() => {
      validateReleaseArgs(INVALID_OPTIONS);
    }).toThrow(
      expect.objectContaining({
        message: 'Validation error: invalid release arguments',
      }),
    );
  });
});
