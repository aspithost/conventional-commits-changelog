import { execFileSyncWrapper } from '../../utils/node/execFileSync.js';

import {
  DEFAULT_REMOTE_SYMBOLIC_REF, FALLBACK_REMOTE_BRANCH, TagRetriever,
} from './TagRetriever.js';

vi.mock('../../utils/node/execFileSync.js', () => ({
  execFileSyncWrapper: vi.fn(() => ''),
}));

const MOCK_ON_ERROR = vi.fn();

describe('TagRetriever', () => {
  it('should throw an error if the user passes invalid arguments to TagRetriever', () => {
    // @ts-expect-error Invalid constructor argument for testing purposes
    expect(() => new TagRetriever({ remoteSymbolicRef: 1234 })).toThrow(expect.objectContaining({
      message: 'Invalid TagRetriever options',
    }));
  });

  it('should retrieve the latest remote tag from the default remote branch', () => {
    const DEFAULT_REMOTE_BRANCH = 'refs/remotes/origin/main';
    const LATEST_TAG = 'v1.2.3';
    vi.mocked(execFileSyncWrapper)
      .mockReturnValueOnce(DEFAULT_REMOTE_BRANCH)
      .mockReturnValueOnce(LATEST_TAG);

    const latestTag = new TagRetriever({ onError: MOCK_ON_ERROR }).getLatestTag();

    expect(latestTag).toBe(LATEST_TAG);
    // The first call to retrieve the default remote branch
    expect(execFileSyncWrapper).toHaveBeenNthCalledWith(
      1,
      'git',
      ['symbolic-ref', DEFAULT_REMOTE_SYMBOLIC_REF],
      process.cwd(),
    );
    // The second call to retrieve the latest tag
    expect(execFileSyncWrapper).toHaveBeenNthCalledWith(
      2,
      'git',
      [
        'describe',
        '--tags',
        '--abbrev=0',
        DEFAULT_REMOTE_BRANCH,
      ],
      process.cwd(),
    );
    expect(MOCK_ON_ERROR).not.toHaveBeenCalled();
  });

  it('should use the the custom releaseBranch and cwd if specified by the user', () => {
    const CWD = '/some/path';
    const REMOTE_SYMBOLIC_REF = 'refs/remotes/origin/some-remote-branch';
    const REMOTE_DEFAULT_BRANCH = 'refs/remotes/origin/release';

    vi.mocked(execFileSyncWrapper)
      .mockReturnValueOnce(REMOTE_DEFAULT_BRANCH)
      .mockReturnValueOnce('v2.0.0');

    new TagRetriever({
      cwd: CWD,
      remoteSymbolicRef: REMOTE_SYMBOLIC_REF,
      onError: MOCK_ON_ERROR,
    }).getLatestTag();

    expect(execFileSyncWrapper).toHaveBeenNthCalledWith(
      1,
      'git',
      ['symbolic-ref', REMOTE_SYMBOLIC_REF],
      CWD,
    );
    expect(execFileSyncWrapper).toHaveBeenNthCalledWith(
      2,
      'git',
      [
        'describe',
        '--tags',
        '--abbrev=0',
        REMOTE_DEFAULT_BRANCH,
      ],
      CWD,
    );
    expect(MOCK_ON_ERROR).not.toHaveBeenCalled();
  });

  it(
    'should fall back to origin/main and log a warning when git cannot find a remote branch',
    () => {
      const SYMBOLIC_REF_ERROR = new Error('Some symbolic ref error');
      vi.mocked(execFileSyncWrapper)
        .mockImplementationOnce(() => {
          throw SYMBOLIC_REF_ERROR;
        })
        .mockReturnValueOnce('v1.0.0');

      new TagRetriever({ onError: MOCK_ON_ERROR }).getLatestTag();

      expect(execFileSyncWrapper).toHaveBeenNthCalledWith(
        2,
        'git',
        [
          'describe',
          '--tags',
          '--abbrev=0',
          FALLBACK_REMOTE_BRANCH,
        ],
        process.cwd(),
      );
      expect(MOCK_ON_ERROR).toHaveBeenCalledExactlyOnceWith(
        `WARN: No remote symbolic reference found. Defaults to ${FALLBACK_REMOTE_BRANCH}.`,
        SYMBOLIC_REF_ERROR,
      );
    },
  );

  it('should return null and log a warning when no tags exist on the remote branch', () => {
    const TAG_ERROR = new Error('no tags found error');
    vi.mocked(execFileSyncWrapper)
      .mockReturnValueOnce('refs/remotes/origin/some-branch-not-relevant-for-this-test')
      .mockImplementationOnce(() => {
        throw TAG_ERROR;
      });

    const latestTag = new TagRetriever({ onError: MOCK_ON_ERROR }).getLatestTag();

    expect(latestTag).toBeNull();
    expect(MOCK_ON_ERROR).toHaveBeenCalledExactlyOnceWith(
      'WARN: no tags found on remote branch.',
      TAG_ERROR,
    );

  });
});
