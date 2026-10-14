import { getReleaseTypeBetweenTags, parseSemverVersion } from './version.js';

describe('parseSemverVersion', () => {
  it('should strip the v prefix', () => {
    expect(parseSemverVersion('v1.2.3')).toBe('1.2.3');
  });

  it('should keep a version without prefix', () => {
    expect(parseSemverVersion('1.2.3')).toBe('1.2.3');
  });
});

describe('getReleaseTypeBetweenTags', () => {
  it.each([
    [
      'v2.0.0',
      'v1.5.3',
      'major',
    ],
    [
      'v1.6.0',
      'v1.5.3',
      'minor',
    ],
    [
      'v1.5.4',
      'v1.5.3',
      'patch',
    ],
    [
      'v1.0.0',
      undefined,
      'major',
    ],
    [
      'v0.1.0',
      undefined,
      'minor',
    ],
    [
      'v0.0.1',
      undefined,
      'patch',
    ],
  ] as const)('should return the type for %s after %s', (tag, previousTag, expected) => {
    expect(getReleaseTypeBetweenTags(tag, previousTag)).toBe(expected);
  });
});
