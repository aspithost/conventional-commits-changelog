
import type { ValidatedCommit } from '../../commits/validate-commits/CommitsValidator.js';
import type { ReleaseType } from '../schemas/release.js';

export function determineReleaseType(
  commits: Iterable<ValidatedCommit>,
): ReleaseType | null {
  let releaseType: ReleaseType | null = null;

  for (const commit of commits) {
    // Breaking change = major (highest priority, can return early)
    const hasBreakingChange = commit.notes.some(note =>
      note.title === 'BREAKING CHANGE' || note.title === 'BREAKING-CHANGE');
    if (hasBreakingChange) {
      return 'major';
    }

    // Feature = minor
    if (commit.type === 'feat') {
      releaseType = 'minor';
    }

    // Fix = patch (only if not already minor)
    if (commit.type === 'fix' && releaseType !== 'minor') {
      releaseType = 'patch';
    }
  }

  return releaseType;
}
