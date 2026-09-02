import { getAllowedCommitScopes } from './getAllowedCommitScopes.js';

const ROOT_SCOPE = 'root';
const BUTTON_SCOPE = 'button';
const CARD_SCOPE = 'card';
const FOUND_SCOPES_MAP = new Map([
  [ROOT_SCOPE, undefined],
  [BUTTON_SCOPE, undefined],
  [CARD_SCOPE, undefined],
]);

describe('getAllowedCommitScopes', () => {
  it('should return all found scopes when the user has not specified allowed scopes', () => {
    const allowedScopesSet = getAllowedCommitScopes(FOUND_SCOPES_MAP.keys(), undefined);

    expect(allowedScopesSet.has(ROOT_SCOPE)).toBe(true);
    expect(allowedScopesSet.has(BUTTON_SCOPE)).toBe(true);
    expect(allowedScopesSet.has(CARD_SCOPE)).toBe(true);
  });

  it('should return only the allowed scopes when the user has specified allowed scopes', () => {
    const allowedScopesSet = getAllowedCommitScopes(FOUND_SCOPES_MAP.keys(), [BUTTON_SCOPE, CARD_SCOPE]);

    expect(allowedScopesSet.has(BUTTON_SCOPE)).toBe(true);
    expect(allowedScopesSet.has(CARD_SCOPE)).toBe(true);
    // @ts-expect-error: Unit test check only
    expect(allowedScopesSet.has(ROOT_SCOPE)).toBe(false);
  });
});
