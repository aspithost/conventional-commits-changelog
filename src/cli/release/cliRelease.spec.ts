import { release } from '../../release/release/release.js';

import { cliRelease } from './cliRelease.js';
import { parseReleaseArgs } from './parse-release-args/parseReleaseArgs.js';

vi.mock('../../release/release/release.js', () => ({
  release: vi.fn(),
}));

const PARSED_RELEASE_ARGS = vi.hoisted(() => ({
  isDryRun: true,
  releaseType: 'minor',
}));
vi.mock('./parse-release-args/parseReleaseArgs.js', () => ({
  parseReleaseArgs: vi.fn(() => PARSED_RELEASE_ARGS),
}));

describe('cliRelease', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  it(
    'should call the release function with the user\'s validated command line arguments',
    async () => {
      await cliRelease();

      expect(release).toHaveBeenCalledExactlyOnceWith(PARSED_RELEASE_ARGS);
      expect(parseReleaseArgs).toHaveBeenCalledOnce();
    },
  );

  it('should log an error if parseReleaseArgs throws an error', async () => {
    const error = new Error('parse error');
    vi.mocked(parseReleaseArgs).mockImplementationOnce(() => {
      throw error;
    });

    await cliRelease();

    expect(release).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(1, 'Release failed:', error.message);
    expect(console.error).toHaveBeenNthCalledWith(2, error.stack);
    expect(process.exitCode).toBe(1);
  });

  it('should log an error if release throws an error', async () => {
    const error = new Error('release error');
    vi.mocked(release).mockImplementationOnce(() => {
      throw error;
    });

    await cliRelease();

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenNthCalledWith(1, 'Release failed:', error.message);
    expect(console.error).toHaveBeenNthCalledWith(2, error.stack);
    expect(process.exitCode).toBe(1);
  });

  it(
    'should log a generic error message if the release cli throws an unexpected error',
    async () => {
      const error = 'unexpected error';
      vi.mocked(release).mockImplementationOnce(() => {
        /* eslint-disable @typescript-eslint/only-throw-error */
        throw error;
      });

      await cliRelease();

      expect(console.error).toHaveBeenCalledOnce();
      expect(console.error).toHaveBeenNthCalledWith(1, 'Release failed');
      expect(process.exitCode).toBe(1);
    },
  );
});
