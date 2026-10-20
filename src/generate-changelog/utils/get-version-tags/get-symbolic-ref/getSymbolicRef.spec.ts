import { _execFileSync } from '../../../../utils/node/execFileSync.js';

import { getSymbolicRef } from './getSymbolicRef.js';

vi.mock('../../../../utils/node/execFileSync.js', () => ({
  _execFileSync: vi.fn(),
}));

describe('getSymbolicRef', () => {
  it('should return the symbolic ref', () => {
    const SYMBOLIC_REF = 'refs/remotes/origin/HEAD';
    const CWD = '/repo';
    const REMOTE_BRANCH = 'refs/remotes/origin/main';
    vi.mocked(_execFileSync).mockReturnValueOnce(REMOTE_BRANCH);

    expect(getSymbolicRef(SYMBOLIC_REF, CWD)).toBe(REMOTE_BRANCH);

    expect(_execFileSync).toHaveBeenCalledExactlyOnceWith(
      'git',
      ['symbolic-ref', SYMBOLIC_REF],
      CWD,
    );
  });

  it('should throw a descriptive error if the git command fails', () => {
    const SYMBOLIC_REF = 'refs/remotes/origin/HEAD';
    const CWD = '/repo';
    const ERROR = new Error('some git error');
    vi.mocked(_execFileSync).mockImplementationOnce(() => {
      throw ERROR;
    });

    expect(() => getSymbolicRef(SYMBOLIC_REF, CWD)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(SYMBOLIC_REF) as string,
        cause: ERROR,
      }),
    );
  });
});
