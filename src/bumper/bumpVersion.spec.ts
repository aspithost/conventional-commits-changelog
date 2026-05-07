import type { ValidatedCommit } from '@/commits/validator/CommitsValidator.js';

import { bumpVersion } from './bumpVersion.js';
import { bumpNpmVersion } from './utils/bumpNpmVersion.js';
import { determineReleaseType } from './utils/determineReleaseType.js';
import { updateReadme } from './utils/updateReadme.js';

vi.mock('./utils/bumpNpmVersion', () => ({
  bumpNpmVersion: vi.fn(),
}));
vi.mock('./utils/determineReleaseType', () => ({
  determineReleaseType: vi.fn(),
}));
vi.mock('./utils/updateReadme', () => ({
  updateReadme: vi.fn(),
}));

const PATH = '/path/to/package';
const RELEASE_TYPE_MINOR = 'minor';
const NEW_VERSION = '1.1.0';

const VALIDATED_COMMIT = {
  hash: 'abc123',
  merge: null,
  revert: null,
  header: 'feat(core): add feature',
  body: null,
  footer: null,
  notes: [],
  mentions: [],
  references: [],
  scope: 'core',
  subject: 'add feature',
  type: 'feat',
} satisfies ValidatedCommit<string, string>;

describe('bumpVersion', () => {
  beforeEach(() => {
    vi.mocked(bumpNpmVersion).mockReturnValue(NEW_VERSION);
    vi.mocked(determineReleaseType).mockReturnValue(RELEASE_TYPE_MINOR);
    vi.mocked(updateReadme);
  });

  it('should not bump the version if no commits require a version bump', () => {
    vi.mocked(determineReleaseType).mockReturnValue(null);
    bumpVersion(PATH, [VALIDATED_COMMIT]);

    expect(determineReleaseType).toHaveBeenCalledWith([VALIDATED_COMMIT]);
    expect(bumpNpmVersion).not.toHaveBeenCalled();
  });

  it('should not update the version when the user does a dryRun', () => {
    bumpVersion('/path/to/package', [VALIDATED_COMMIT], { dryRun: true });

    expect(determineReleaseType).toHaveBeenCalledWith([VALIDATED_COMMIT]);
    expect(bumpNpmVersion).not.toHaveBeenCalled();
    expect(updateReadme).not.toHaveBeenCalled();
  });

  it('it should bump the version', () => {
    bumpVersion(PATH, [VALIDATED_COMMIT]);

    expect(bumpNpmVersion).toHaveBeenCalledWith(PATH, RELEASE_TYPE_MINOR);
  });

  it('by default, it should update the README with the new version', () => {
    bumpVersion(PATH, [VALIDATED_COMMIT]);

    expect(updateReadme).toHaveBeenCalledWith(PATH, NEW_VERSION);
  });

  it('should not update the README if the user opts out', () => {
    bumpVersion(PATH, [VALIDATED_COMMIT], { isUpdateReadme: false });

    expect(bumpNpmVersion).toHaveBeenCalledWith(PATH, RELEASE_TYPE_MINOR);
    expect(updateReadme).not.toHaveBeenCalled();
  });

  it('should return the new version and release type', () => {
    const result = bumpVersion(PATH, [VALIDATED_COMMIT]);
    expect(result).toEqual({ version: NEW_VERSION, releaseType: RELEASE_TYPE_MINOR });
  });
});
