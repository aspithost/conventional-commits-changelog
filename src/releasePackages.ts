import { DirectoriesReader, type DirectoryPathByScopeMap, type ScopesReaderOptions } from './read-directories/DirectoriesReader.js';
import { release, type BaseReleaseOptions } from './release.js';
import { CommitsGrouper, type CommitsByScopeMap } from './shared/commits/group-commits/CommitsGrouper.js';
import { retrieveValidatedCommits, type RetrieveCommitsOptions } from './shared/commits/retrieveValidatedCommits.js';
import type { ValidatedCommit } from './shared/commits/validate-commits/types/commit.js';
import type { DefaultAllowedTypes } from './shared/types/commit.js';
import { logError } from './shared/utils/error/logError.js';

interface BaseReleasePackageOptions<
  T extends string
> extends Omit<BaseReleaseOptions, 'releaseType'> {
  rootScopeOptions?: ScopesReaderOptions<T>['rootScopeOptions'];
}
type ReleasePackagesOptionsWithoutCommits<
  T extends string,
  U extends DefaultAllowedTypes = DefaultAllowedTypes
> = BaseReleasePackageOptions<T> & RetrieveCommitsOptions<T, U>;

interface ReleasePackagesOptionsWithCommits<
  T extends string,
  U extends string
> extends BaseReleasePackageOptions<T> {
  commits: Iterable<ValidatedCommit<T, U>>;
}

interface ReleasePackagesOptions<
  T extends string,
  U extends string
> extends BaseReleasePackageOptions<T>, Partial<RetrieveCommitsOptions<T, U>> {
  commits?: Iterable<ValidatedCommit<T, U>>;
}

export async function releasePackages<
  T extends string,
  U extends DefaultAllowedTypes = DefaultAllowedTypes
>(options: ReleasePackagesOptionsWithoutCommits<T, U>): Promise<void>;
export async function releasePackages<
  T extends string,
  U extends string
>(options: ReleasePackagesOptionsWithCommits<T, U>): Promise<void>;
export async function releasePackages<T extends string, U extends string>({
  changelogWriterOptions,
  commits,
  commitsParserOptions,
  commitsRetrieverOptions,
  commitsValidatorOptions,
  directoryPath = process.cwd(),
  isDryRun = false,
  isUpdateReadme = true,
  rootScopeOptions,
  onError = logError,
}: ReleasePackagesOptions<T, U> = {}): Promise<void> {
  const directoriesReader = new DirectoriesReader({
    directoryPath,
    rootScopeOptions,
    onError,
  });
  const directoryPathByScopeMap = directoriesReader.directoryPathByScopeMap;
  if (!directoryPathByScopeMap.size) throw new Error('No scopes found in the specified directory');

  const resolvedCommits = [...(commits ?? retrieveValidatedCommits({
    commitsParserOptions,
    commitsRetrieverOptions,
    commitsValidatorOptions: {
      ...commitsValidatorOptions,
      allowedCommitScopes: [...getAllowedCommitScopesSet(
        directoriesReader.scopes,
        commitsValidatorOptions?.allowedCommitScopes,
      )],
    },
    onError,
  }))];

  const commitsGrouper = new CommitsGrouper(resolvedCommits);

  const releasePackagesResults = await releaseByScope(
    directoryPathByScopeMap,
    commitsGrouper.commitsByScope,
    {
      changelogWriterOptions,
      isDryRun,
      isUpdateReadme,
      onError,
    },
  );

  handleReleasePackagesErrors(releasePackagesResults, onError);
}

function handleReleasePackagesErrors(
  releasePackagesResults: PromiseSettledResult<void>[],
  onError: NonNullable<BaseReleaseOptions['onError']>,
) {
  const failures = releasePackagesResults
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  for (const failure of failures) {
    onError('A package release failed.', { error: failure.reason as unknown });
  }
}

async function releaseByScope(
  directoryPathByScopeMap: DirectoryPathByScopeMap<string>,
  commitsByScopeMap: CommitsByScopeMap,
  {
    changelogWriterOptions,
    isDryRun,
    isUpdateReadme,
    onError,
  }: Partial<BaseReleaseOptions> = {},
): Promise<PromiseSettledResult<void>[]> {
  const releasePromises: Promise<void>[] = [];

  for (const [scopeName, commitsByScope] of commitsByScopeMap) {
    const directoryPathByScopeEntry = directoryPathByScopeMap.get(scopeName);
    if (!directoryPathByScopeEntry) continue; // Note: edge case, should not happen as commits are filted by found and allowed scopes

    const { directoryPath } = directoryPathByScopeEntry;
    releasePromises.push(release({
      changelogWriterOptions,
      commits: commitsByScope,
      directoryPath,
      isDryRun,
      isUpdateReadme,
      onError,
    }));
  }

  const releasePackagesResults = await Promise.allSettled(releasePromises);
  return releasePackagesResults;
}

function getAllowedCommitScopesSet<T extends string>(
  foundScopes: MapIterator<string>,
  allowedScopes?: readonly T[],
): Set<T> | Set<string> {
  if (!allowedScopes?.length) return new Set<string>(foundScopes);

  const allowedScopesSet = new Set<string>(allowedScopes);

  return new Set(
    foundScopes.filter((scope): scope is T => allowedScopesSet.has(scope)),
  );
}

