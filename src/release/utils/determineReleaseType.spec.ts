import type { ValidatedCommit } from '../../commits/validate-commits/CommitsValidator.js';
import { determineReleaseType } from '../../release/utils/determineReleaseType.js';

const VALIDATED_COMMIT = {
  notes: [],
  type: 'feat',
} as unknown as ValidatedCommit;

describe('determineReleaseType', () => {
  it('should return major for commits with a BREAKING CHANGE note', () => {
    const releaseType = determineReleaseType(
      [
        {
          ...VALIDATED_COMMIT,
          notes: [
            {
              title: 'BREAKING CHANGE',
              text: 'breaking!!',
            },
          ],
        },
      ],
    );

    expect(releaseType).toBe('major');
  });

  it('should return major for commits with a BREAKING-CHANGE note (hyphenated)', () => {
    const releaseType = determineReleaseType(
      [
        {
          ...VALIDATED_COMMIT,
          notes: [
            {
              title: 'BREAKING-CHANGE',
              text: 'breaking!!',
            },
          ],
        },
      ],
    );

    expect(releaseType).toBe('major');
  });

  it('should return minor for feat commits', () => {
    const releaseType = determineReleaseType([VALIDATED_COMMIT]);

    expect(releaseType).toBe('minor');
  });

  it('should return patch for fix commits', () => {
    const commits = [
      {
        ...VALIDATED_COMMIT,
        type: 'fix',
      },
    ];
    const releaseType = determineReleaseType(commits);

    expect(releaseType).toBe('patch');
  });
});
