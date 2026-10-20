import { parseSemverVersionFromTag } from './parseSemverVersionFromTag.js';

describe('parseSemverVersionFromTag', () => {
  it('should return the version', () => {
    expect(parseSemverVersionFromTag('1.2.3')).toBe('1.2.3');
  });

  it('should strip the v prefix from the version', () => {
    expect(parseSemverVersionFromTag('v1.2.3')).toBe('1.2.3');
  });

  it('should allow version with multiple integers', () => {
    const VERSION = 'v11.12.134';
    expect(parseSemverVersionFromTag(VERSION)).toBe('11.12.134');
  });

  describe('tag does not match semver pattern', () => {
    test.each([
      'not-a-valid-semver-version',
      'v1.2.3.4',
      '1.2',
      'v1',
      '1',
    ])('should return the original tag for %s', (invalidTag) => {
      expect(parseSemverVersionFromTag(invalidTag)).toBe(invalidTag);
    });
  });
});
