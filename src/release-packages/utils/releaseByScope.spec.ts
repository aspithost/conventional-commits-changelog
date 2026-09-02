import type { CommitsByScopeMap } from '@/commits/group-commits/CommitsGrouper.js';
import type { DirectoryPathByScopeMap } from '@/read-directories/DirectoriesReader.js';
import { release } from '@/release/release.js';
import type { ChangelogWriterOptions } from '@/write-changelog/ChangelogWriter.js';
import { releaseByScope } from './releaseByScope.js';

vi.mock('@/release/release.js');

const PATH_TO_BUTTON = '/path/to/button';
const PATH_TO_CARD = '/path/to/card';
const DIRECTORY_PATH_BY_SCOPE_MAP = new Map([
  ['button', { directoryPath: PATH_TO_BUTTON }],
  ['card', { directoryPath: PATH_TO_CARD }],
]) as unknown as DirectoryPathByScopeMap<string>;

const COMMITS_BY_SCOPE_MAP = new Map([
  ['button', [{ scope: 'button', message: 'feat: add button' }]],
  ['card', [{ scope: 'card', message: 'feat: add card' }]],
  ['root', [{ scope: 'root', message: 'feat: add something' }]],
]) as unknown as CommitsByScopeMap<string>;

const onError = vi.fn();
const OPTIONS = {
  changelogWriterOptions: { someKey: 'someValue' } as unknown as Partial<ChangelogWriterOptions>,
  isDryRun: false,
  isUpdateReadme: true,
  onError,
};

describe('releaseByScope', () => {
  it('should call release once for each scope that has a commits and directory path entry', async () => {
    await releaseByScope(
      DIRECTORY_PATH_BY_SCOPE_MAP,
      COMMITS_BY_SCOPE_MAP,
      OPTIONS,
    );

    expect(vi.mocked(release)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(release)).toHaveBeenNthCalledWith(1, {
      commits: COMMITS_BY_SCOPE_MAP.get('button'),
      directoryPath: PATH_TO_BUTTON,
      ...OPTIONS,
    });
    expect(vi.mocked(release)).toHaveBeenNthCalledWith(2, {
      commits: COMMITS_BY_SCOPE_MAP.get('card'),
      directoryPath: PATH_TO_CARD,
      ...OPTIONS,
    });
  });

  it('should return a PromiseSettledResult array with the results of each release call', async () => {
    const result = await releaseByScope(
      DIRECTORY_PATH_BY_SCOPE_MAP,
      COMMITS_BY_SCOPE_MAP,
      OPTIONS,
    );

    expect(result).toHaveLength(2);
    expect(result).toStrictEqual([
      { status: 'fulfilled', value: undefined },
      { status: 'fulfilled', value: undefined },
    ]);
  });
});
