export function getAllowedCommitsScopes<T extends string>(
  foundScopes: Set<string>,
  allowedScopes: Set<T>,
): Set<T>;
export function getAllowedCommitsScopes<T extends string>(
  foundScopes: Set<string>,
  allowedScopes?: Set<T>,
): Set<string>;
export function getAllowedCommitsScopes<T extends string>(
  foundScopes: Set<string>,
  allowedScopes?: Set<T>,
): Set<T | string> {
  if (!allowedScopes?.size) return new Set<string>(foundScopes);

  const foundScopesArray = [...foundScopes];
  const allowedScopesSet = new Set<string>(allowedScopes);

  return new Set(
    foundScopesArray.filter((scope): scope is T => allowedScopesSet.has(scope)),
  );
}
