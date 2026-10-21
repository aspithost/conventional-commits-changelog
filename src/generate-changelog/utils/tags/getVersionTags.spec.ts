
import { getSortedTags } from '../generate-changelog-versioned/get-sorted-tags/getSortedTags.js';

import { getSymbolicRef } from './get-symbolic-ref/getSymbolicRef.js';
import { getVersionTags } from './getVersionTags.js';

vi.mock('../generate-changelog-versioned/get-sorted-tags/getSortedTags.js');
vi.mock('./get-symbolic-ref/getSymbolicRef.js');

describe('getVersionTags', () => {
  it('should retrieve git version tags', () => {
    const CWD = '/repo';
    const REMOTE_SYMBOLIC_REF = 'refs/remotes/origin/HEAD';
    const REMOTE_BRANCH = 'refs/remotes/origin/main';
    vi.mocked(getSymbolicRef).mockReturnValueOnce(REMOTE_BRANCH);

    getVersionTags({
      cwd: CWD,
      remoteSymbolicRef: REMOTE_SYMBOLIC_REF,
    });

    expect(getSymbolicRef).toHaveBeenCalledExactlyOnceWith(
      REMOTE_SYMBOLIC_REF,
      CWD,
    );
    expect(getSortedTags).toHaveBeenCalledExactlyOnceWith(REMOTE_BRANCH, CWD);
  });
});
