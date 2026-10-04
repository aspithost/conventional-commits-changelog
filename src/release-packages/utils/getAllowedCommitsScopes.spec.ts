import { getAllowedCommitsScopes } from './getAllowedCommitsScopes.js';

const ROOT_SCOPE = 'root';
const BUTTON_SCOPE = 'button';
const CARD_SCOPE = 'card';
const FOUND_SCOPES_MAP = new Set([
  ROOT_SCOPE,
  BUTTON_SCOPE,
  CARD_SCOPE,
]);

describe('getAllowedCommitsScopes', () => {
  it('should return all found scopes when the user has not specified allowed scopes', () => {
    const allowedScopesSet = getAllowedCommitsScopes(FOUND_SCOPES_MAP, undefined);

    expect(allowedScopesSet.has(ROOT_SCOPE)).toBe(true);
    expect(allowedScopesSet.has(BUTTON_SCOPE)).toBe(true);
    expect(allowedScopesSet.has(CARD_SCOPE)).toBe(true);
  });

  it('should return only the allowed scopes when the user has specified allowed scopes', () => {
    const allowedScopesSet = getAllowedCommitsScopes(
      FOUND_SCOPES_MAP,
      new Set([BUTTON_SCOPE, CARD_SCOPE]),
    );

    expect(allowedScopesSet.has(BUTTON_SCOPE)).toBe(true);
    expect(allowedScopesSet.has(CARD_SCOPE)).toBe(true);
    expect(allowedScopesSet.has(ROOT_SCOPE)).toBe(false);
  });
});
