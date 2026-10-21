import { _execFileSync } from '../../../../utils/node/execFileSync.js';

import { getTagDate } from './getTagDate.js';

vi.mock('../../../../utils/node/execFileSync.js', () => ({
  _execFileSync: vi.fn(),
}));

describe('getTagDate', () => {
  it('should return the formatted commit date of a tag', () => {
    const TAG = 'v1.2.3';
    const DATE = '2025-01-01';
    const CWD = process.cwd();
    vi.mocked(_execFileSync).mockReturnValueOnce(DATE);

    expect(getTagDate(TAG, CWD)).toBe(DATE);

    expect(_execFileSync).toHaveBeenCalledExactlyOnceWith('git', [
      'log',
      '-1',
      '--format=%cs',
      TAG,
    ], CWD);
  });

  it('should throw a descriptive error if the git command fails', () => {
    const TAG = 'v2.3.4';
    const ERROR = new Error('some git error');
    vi.mocked(_execFileSync).mockImplementationOnce(() => {
      throw ERROR;
    });

    expect(() => getTagDate(
      TAG,
      process.cwd(),
    )).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(TAG) as string,
        cause: ERROR,
      }),
    );
  });
});
