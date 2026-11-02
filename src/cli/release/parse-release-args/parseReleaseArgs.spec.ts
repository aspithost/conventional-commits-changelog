import { parseReleaseArgs } from './parseReleaseArgs.js';
import type { CliReleaseOptions } from './schemas/cliReleaseOptions.js';
import { validateReleaseArgs } from './utils/validateReleaseArgs.js';

vi.mock('./utils/validateReleaseArgs.js', () => ({
  validateReleaseArgs: vi.fn((args: CliReleaseOptions) => args),
}));

const ARGV = [
  '--dry-run',
  '--cwd',
  '/some/path',
  '--type',
  'minor',
];

const RELEASE_ARGS = {
  directoryPath: '/some/path',
  isDryRun: true,
  isUpdateReadme: true,
  releaseType: 'minor',
  releaseVersion: undefined,
};

describe('parseReleaseArgs', () => {
  it('should parse valid release arguments without throwing an error', () => {
    const parsedReleaseArgs = parseReleaseArgs(ARGV);

    expect(parsedReleaseArgs).toStrictEqual(RELEASE_ARGS);
  });

  it('should validate parser input arguments', () => {
    parseReleaseArgs(ARGV);

    expect(validateReleaseArgs).toHaveBeenCalledExactlyOnceWith(RELEASE_ARGS);
  });

  it('should throw an error if the user specifies invalid release arguments', () => {
    const someError = new Error('Invalid release arguments');
    vi.mocked(validateReleaseArgs).mockImplementationOnce(() => {
      throw someError;
    });

    expect(() => parseReleaseArgs([])).toThrow(someError);
  });

  it(
    'should throw an error when the user specifies both a release type and release version',
    () => {
      const INVALID_ARGV = [
        ...ARGV,
        '--version',
        '1.0.0',
      ];

      expect(() => parseReleaseArgs(INVALID_ARGV))
        .toThrow('Use either --type or --version, not both.');
    },
  );
});
