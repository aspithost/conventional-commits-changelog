import { getSortedTags } from './getSortedTags.js';

import { _execFileSync } from '@/utils/node/execFileSync.js';

vi.mock('@/utils/node/execFileSync.js', () => ({
  _execFileSync: vi.fn(),
}));

describe('getSortedTags', () => {
  it('should return only version tags in ascending order', () => {
    const BRANCH = 'main';
    const CWD = '/repo';
    vi.mocked(_execFileSync).mockReturnValueOnce(
      'nightly\nv1.0.0\n1.1.0\nv1.2.0\nv2.0.0-beta.1\n',
    );

    expect(getSortedTags(BRANCH, CWD)).toEqual([
      'v1.0.0',
      '1.1.0',
      'v1.2.0',
    ]);

    expect(_execFileSync).toHaveBeenCalledExactlyOnceWith(
      'git',
      [
        'tag',
        '--list',
        '--merged',
        BRANCH,
        '--sort=v:refname',
      ],
      CWD,
    );
  });

  it('should return an empty array when there are no version tags', () => {
    vi.mocked(_execFileSync).mockReturnValueOnce('nightly\nv1.0.0-beta.1');

    expect(getSortedTags('main', '/repo')).toEqual([]);
  });

  it('should throw a descriptive error if the git command fails', () => {
    const BRANCH = 'main';
    const CWD = '/repo';
    const ERROR = new Error('some git error');
    vi.mocked(_execFileSync).mockImplementationOnce(() => {
      throw ERROR;
    });

    expect(() => getSortedTags(BRANCH, CWD)).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(BRANCH) as string,
        cause: ERROR,
      }),
    );
  });
});
