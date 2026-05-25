import { bumpVersion } from './bumpVersion.js';
import { bumpNpmVersion } from './utils/bumpNpmVersion.js';
import { updateReadme } from './utils/updateReadme.js';

vi.mock('./utils/bumpNpmVersion', () => ({
  bumpNpmVersion: vi.fn(),
}));
vi.mock('./utils/updateReadme', () => ({
  updateReadme: vi.fn(),
}));

const WORKING_DIRECTORY = '/path/to/package';
const RELEASE_TYPE_MINOR = 'minor';
const NEW_VERSION = '1.1.0';

describe('bumpVersion', () => {
  beforeEach(() => {
    vi.mocked(bumpNpmVersion).mockReturnValue(NEW_VERSION);
    vi.mocked(updateReadme);
  });

  it('it should bump the version, update the README version, and return the new version', () => {
    const bumpVersionResult = bumpVersion(WORKING_DIRECTORY, RELEASE_TYPE_MINOR);

    expect(bumpNpmVersion).toHaveBeenCalledWith(WORKING_DIRECTORY, RELEASE_TYPE_MINOR);
    expect(bumpVersionResult).toBe(NEW_VERSION);
  });

  it('should not update the README if the user opts out', () => {
    bumpVersion(WORKING_DIRECTORY, RELEASE_TYPE_MINOR, { isUpdateReadme: false });

    expect(bumpNpmVersion).toHaveBeenCalledWith(WORKING_DIRECTORY, RELEASE_TYPE_MINOR);
    expect(updateReadme).not.toHaveBeenCalled();
  });

  it('should throw an error if the user does not provide a path to a working directory', () => {
    // @ts-expect-errorts-expect-error: unit test with undefined param
    expect(() => bumpVersion(undefined, RELEASE_TYPE_MINOR)).toThrow();
  });
});
