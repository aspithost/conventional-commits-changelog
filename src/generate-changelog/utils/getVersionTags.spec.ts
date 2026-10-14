import { getVersionTags } from './getVersionTags.js';
import { getSortedTags } from './git/getSortedTags.js';
import { getSymbolicRef } from './git/getSymbolicRef.js';

vi.mock('./git/getSortedTags.js');
vi.mock('./git/getSymbolicRef.js');

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
