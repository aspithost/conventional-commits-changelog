import { parseReleasePackagesArgs } from './parseReleasePackagesArgs.js';
import type { CliReleasePackagesOptions } from './schemas/cliReleasePackagesOptions.js';
import { validateReleasePackagesArgs } from './utils/validateReleasePackagesArgs.js';

vi.mock('./utils/validateReleasePackagesArgs.js', () => ({
  validateReleasePackagesArgs: vi.fn((args: CliReleasePackagesOptions) => args),
}));

const ARGV = [
  '--cwd',
  '/some/path',
  '--dry-run',
];

const RELEASE_PACKAGES_ARGS = {
  directoryPath: '/some/path',
  isDryRun: true,
  isUpdateReadme: false,
};

describe('parseReleasePackagesArgs', () => {
  it('should parse valid release packages arguments without throwing an error', () => {
    const parsedArgs = parseReleasePackagesArgs(ARGV);

    expect(parsedArgs).toStrictEqual(RELEASE_PACKAGES_ARGS);
  });

  it('should validate parser input arguments', () => {
    parseReleasePackagesArgs(ARGV);

    expect(validateReleasePackagesArgs).toHaveBeenCalledExactlyOnceWith(RELEASE_PACKAGES_ARGS);
  });

  it('should throw an error if the user specifies invalid release packages arguments', () => {
    const someError = new Error('Invalid release packages arguments');
    vi.mocked(validateReleasePackagesArgs).mockImplementationOnce(() => {
      throw someError;
    });

    expect(() => parseReleasePackagesArgs([])).toThrow(someError);
  });
});
