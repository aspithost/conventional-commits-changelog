import { getFilteredCommitsScopes } from './getFilteredCommitsScopes.js';

const allowedCommitScopes = new Set([
  '@some-scope/root',
  '@some-other-scope/button',
  'card',
]);

describe('getFilteredCommitsScopes', () => {
  it('should return package names without the scope when the user opts in', () => {
    const filteredScopes = getFilteredCommitsScopes(allowedCommitScopes, true);

    expect(filteredScopes.size).toBe(3);
    expect(filteredScopes.has('root')).toBe(true);
    expect(filteredScopes.has('button')).toBe(true);
    expect(filteredScopes.has('card')).toBe(true);
  });

  it('should return the full package names by default', () => {
    const filteredScopes = getFilteredCommitsScopes(allowedCommitScopes, false);

    expect(filteredScopes.size).toBe(3);
    expect(filteredScopes.has('@some-scope/root')).toBe(true);
    expect(filteredScopes.has('@some-other-scope/button')).toBe(true);
    expect(filteredScopes.has('card')).toBe(true);
  });
});
