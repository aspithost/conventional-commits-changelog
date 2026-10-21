export function getFilteredCommitsScopes<T extends string>(
  allowedCommitScopes: Iterable<T>,
  isFilterScopes: true,
): Set<string>;
export function getFilteredCommitsScopes<T extends string>(
  allowedCommitScopes: Iterable<T>,
  isFilterScopes?: boolean,
): Set<T>;
export function getFilteredCommitsScopes<T extends string>(
  allowedCommitScopes: Iterable<T>,
  isFilterScopes = false,
): Set<T | string> {
  if (!isFilterScopes) return new Set<T>(allowedCommitScopes);

  return new Set(
    [...allowedCommitScopes].map(scope => {
      const packageNameSplit = scope.split('/');
      if (packageNameSplit.length > 1) {
        return packageNameSplit[1];
      }
      return scope;
    }),
  );
}
