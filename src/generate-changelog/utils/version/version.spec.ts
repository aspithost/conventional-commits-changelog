import { getReleaseTypeBetweenTags, parseSemverVersion } from './version.js';

describe('parseSemverVersion', () => {
  it('should strip the v prefix from the version', () => {
    expect(parseSemverVersion('v1.2.3')).toBe('1.2.3');
  });

  it('should return the version without a prefix', () => {
    expect(parseSemverVersion('1.2.3')).toBe('1.2.3');
  });
});

describe('getReleaseTypeBetweenTags', () => {
  it.each([
    [
      'major',
      'v1.5.3',
      'v2.0.0',
    ],
    [
      'minor',
      'v1.5.3',
      'v1.6.0',
    ],
    [
      'patch',
      'v1.5.3',
      'v1.5.4',
    ],
    [
      'major',
      undefined,
      'v1.0.0',
    ],
    [
      'minor',
      undefined,
      'v0.1.0',
    ],
    [
      'patch',
      undefined,
      'v0.0.1',
    ],
  ] as const)(
    'should return the expected %s type for updates from version %s to version %s',
    (expected, previousTag, newTag) => {
      expect(getReleaseTypeBetweenTags(newTag, previousTag)).toBe(expected);
    },
  );
});
