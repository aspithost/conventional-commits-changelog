import type { ValidatedCommits } from '@/shared/commits/validate-commits/types/commits.js';
import type { ReleaseType } from '@/types/index.js';

export function determineReleaseType(
  commits: ValidatedCommits<string, string>,
): ReleaseType | null {
  let releaseType: ReleaseType | null = null;

  for (const commit of commits) {
    // Breaking change = major (highest priority, can return early)
    const hasBreakingChange = commit.notes.some(note =>
      note.title === 'BREAKING CHANGE' || note.title === 'BREAKING-CHANGE',
    );
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
