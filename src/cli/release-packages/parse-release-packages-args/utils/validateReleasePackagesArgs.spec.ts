import type { CliReleasePackagesOptions } from '../schemas/cliReleasePackagesOptions.js';

import { validateReleasePackagesArgs } from './validateReleasePackagesArgs.js';

const VALID_OPTIONS: CliReleasePackagesOptions = {
  directoryPath: '/path/to/packages',
  isDryRun: true,
  isUpdateReadme: true,
};

describe('validateReleasePackagesArgs', () => {
  it(
    'should return the options when the user provides valid release packages parameters',
    () => {
      expect(validateReleasePackagesArgs(VALID_OPTIONS)).toStrictEqual(VALID_OPTIONS);
    },
  );
  test.each([
    { directoryPath: 123 },
    { isDryRun: 'true' },
    { isUpdateReadme: 'false' },
  ])('should throw an error for invalid release packages input', (options) => {
    const INVALID_OPTIONS = {
      ...VALID_OPTIONS,
      ...options,
    };

    expect(() => {
      validateReleasePackagesArgs(INVALID_OPTIONS);
    }).toThrow(
      expect.objectContaining({
        message: 'Validation error: invalid release packagesarguments',
      }),
    );
  });
});
