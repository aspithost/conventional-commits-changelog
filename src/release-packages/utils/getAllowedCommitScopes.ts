export function getAllowedCommitScopes<T extends string>(
  foundScopes: MapIterator<string>,
  allowedScopes?: readonly T[],
): Set<T> | Set<string> {
  if (!allowedScopes?.length) return new Set<string>(foundScopes);

  const allowedScopesSet = new Set<string>(allowedScopes);

  return new Set(
    foundScopes.filter((scope): scope is T => allowedScopesSet.has(scope)),
  );
}
