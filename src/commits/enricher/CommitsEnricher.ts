import type { ReleaseType } from '@/types/index.js';

import type { ValidatedCommit, ValidatedCommits } from '../validator/CommitsValidator.js';

const RELEASE_TYPE_MAPPINGS: Record<number, ReleaseType | null> = {
  3: 'major',
  2: 'minor',
  1: 'patch',
  0: null,
};
type ReleaseTypeKey = keyof typeof RELEASE_TYPE_MAPPINGS;

interface ValidatedCommitWithReleaseType<T extends string, U extends string> extends ValidatedCommit<T, U> {
  releaseType: ReleaseType | null;
}
type ValidatedCommitsWithReleaseType<T extends string, U extends string> = Iterable<ValidatedCommitWithReleaseType<T, U>>;

export class CommitsEnricher {
  static *enrichWithReleaseType<T extends string, U extends string>(
    validatedCommits: ValidatedCommits<T, U>,
  ): ValidatedCommitsWithReleaseType<T, U> {
    let releaseType: ReleaseTypeKey = 0;
    for (const validatedCommit of validatedCommits) {
      const commitReleaseType = this.getReleaseTypeForCommit(validatedCommit);
      if (commitReleaseType > releaseType) {
        releaseType = commitReleaseType;
      }
      yield {
        ...validatedCommit,
        releaseType: RELEASE_TYPE_MAPPINGS[releaseType],
      };
    }
  }

  static *enrichWithReleaseTypes<T extends string, U extends string>(
    validatedCommits: ValidatedCommits<T, U>,
  ): ValidatedCommitsWithReleaseType<T, U> {
    const releaseTypesMap = new Map<string, ReleaseTypeKey>();
    for (const validatedCommit of validatedCommits) {
      let releaseType = this.getReleaseTypeForCommit(validatedCommit);
      const { scope } = validatedCommit;
      const releaseTypeByScope = releaseTypesMap.get(scope ?? 'root');
      if (releaseTypeByScope && releaseTypeByScope >= releaseType) {
        releaseType = releaseTypeByScope;
      } else {
        releaseTypesMap.set(scope ?? 'root', releaseType);
      }
      yield {
        ...validatedCommit,
        releaseType: RELEASE_TYPE_MAPPINGS[releaseType],
      };
    }
  }

  private static getReleaseTypeForCommit<T extends string, U extends string>(
    validatedCommit: ValidatedCommit<T, U>,
  ): ReleaseTypeKey {
    if (validatedCommit.notes.some(note =>
      note.title === 'BREAKING CHANGE' || note.title === 'BREAKING-CHANGE',
    )) {
      return 3;
    }
    if (validatedCommit.type === 'feat') {
      return 2;
    }
    if (validatedCommit.type === 'fix') {
      return 1;
    }
    return 0;
  }
}
