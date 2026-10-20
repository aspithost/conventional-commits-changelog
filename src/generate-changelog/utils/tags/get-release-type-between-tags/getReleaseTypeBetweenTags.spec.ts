import { getReleaseTypeBetweenTags } from './getReleaseTypeBetweenTags.js';

describe('getReleaseTypeBetweenTags', () => {
  it.each([
    [
      'major',
      '@abelspithost/commitlint@1.5.3',
      'v2.0.0',
    ],
    [
      'minor',
      '@abelspithost/commitlint@1.5.3',
      'v1.6.0',
    ],
    [
      'patch',
      '1.5.3',
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

  it.each([
    [
      'patch',
      'v1.1.1',
      'v2',
    ],
    [
      'minor',
      'v1',
      'v0.1.1',
    ],
  ])('should handle invalid types properly', (expected, previousTag, newTag) => {
    expect(getReleaseTypeBetweenTags(newTag, previousTag)).toBe(expected);
  });
});
