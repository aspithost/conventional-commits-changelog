import { execSync } from 'node:child_process';
import { bumpNpmVersion } from './bumpNpmVersion.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('bumpNpmVersion', () => {
  beforeEach(() => {
    vi.mocked(execSync);
  });

  it('should call npm version with correct arguments', () => {
    vi.mocked(execSync).mockReturnValue('v1.1.0\n');
    const RELEASE_TYPE = 'minor';
    bumpNpmVersion('/path/to/package', RELEASE_TYPE);

    expect(execSync).toHaveBeenCalledWith(
      `npm version ${RELEASE_TYPE} --no-git-tag-version`,
      { cwd: '/path/to/package', encoding: 'utf-8' },
    );
  });

  it('should return the bumped version without v prefix', () => {
    vi.mocked(execSync).mockReturnValue('v2.0.0\n');

    const result = bumpNpmVersion('/path/to/package', 'minor');

    expect(execSync).toHaveBeenCalledTimes(1);
    expect(result).toBe('2.0.0');
  });

  it('should throw an error if npm version fails', () => {
    console.error = vi.fn(); // Suppress logs
    const ERROR = new Error('npm version failed');
    vi.mocked(execSync).mockImplementation(() => {
      throw ERROR;
    });

    expect(() => bumpNpmVersion('/path/to/package', 'minor')).toThrow(ERROR);
    expect(execSync).toHaveBeenCalledTimes(1);
  });
});
