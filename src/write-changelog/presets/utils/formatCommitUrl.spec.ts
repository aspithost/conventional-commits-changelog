import { formatCommitUrl } from './formatCommitUrl.js';

describe('formatCommitUrl', () => {
  it('should format a commit URL with host, owner, repository and commit hash', () => {
    const HOST = 'https://github.com';
    const OWNER = 'user';
    const REPOSITORY = 'repo';
    const COMMIT_HASH = 'abc123';

    const commitUrl = formatCommitUrl(
      { host: HOST, owner: OWNER, repository: REPOSITORY },
      { hash: COMMIT_HASH },
    );

    expect(commitUrl).toBe(`${HOST}/${OWNER}/${REPOSITORY}/commit/${COMMIT_HASH}`);
  });

  it('should silently handle missing commit information', () => {
    const commitUrl = formatCommitUrl({}, {});
    expect(commitUrl).toBeUndefined();
  });
});
