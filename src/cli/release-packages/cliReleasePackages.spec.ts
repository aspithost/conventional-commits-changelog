import { releasePackages } from '../../release/release-packages/releasePackages.js';

import { cliReleasePackages } from './cliReleasePackages.js';
import {
  parseReleasePackagesArgs,
} from './parse-release-packages-args/parseReleasePackagesArgs.js';

vi.mock('../../release/release-packages/releasePackages.js', () => ({
  releasePackages: vi.fn(),
}));

const PARSED_RELEASE_PACKAGES_ARGS = vi.hoisted(() => ({
  directoryPath: '/some/path',
  isDryRun: true,
  isUpdateReadme: true,
}));
vi.mock('./parse-release-packages-args/parseReleasePackagesArgs.js', () => ({
  parseReleasePackagesArgs: vi.fn(() => PARSED_RELEASE_PACKAGES_ARGS),
}));

describe('cliReleasePackages', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  it(
    'should call the releasePackages function with the user\'s validated command line arguments',
    async () => {
      await cliReleasePackages();

      expect(releasePackages).toHaveBeenCalledExactlyOnceWith(PARSED_RELEASE_PACKAGES_ARGS);
      expect(parseReleasePackagesArgs).toHaveBeenCalledOnce();
    },
  );

  it('should log an error if parseReleasePackagesArgs throws an error', async () => {
    const error = new Error('parse error');
    vi.mocked(parseReleasePackagesArgs).mockImplementationOnce(() => {
      throw error;
    });

    await cliReleasePackages();

    expect(releasePackages).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(1, 'Release packages failed:', error.message);
    expect(console.error).toHaveBeenNthCalledWith(2, error.stack);
    expect(process.exitCode).toBe(1);
  });

  it('should log an error if releasePackages throws an error', async () => {
    const error = new Error('release packages error');
    vi.mocked(releasePackages).mockImplementationOnce(() => {
      throw error;
    });

    await cliReleasePackages();

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(1, 'Release packages failed:', error.message);
    expect(console.error).toHaveBeenNthCalledWith(2, error.stack);
    expect(process.exitCode).toBe(1);
  });

  it(
    'should log a generic error message if the release packages cli throws an unexpected error',
    async () => {
      const error = 'unexpected error';
      vi.mocked(releasePackages).mockImplementationOnce(() => {
        /* eslint-disable @typescript-eslint/only-throw-error */
        throw error;
      });

      await cliReleasePackages();

      expect(console.error).toHaveBeenCalledOnce();
      expect(console.error).toHaveBeenNthCalledWith(1, 'Release packages failed');
      expect(process.exitCode).toBe(1);
    },
  );
});
