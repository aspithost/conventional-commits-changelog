import type { ReleaseType } from '../../../release/types/release.js';

export function parseSemverVersion(tag: string): string {
  return tag.startsWith('v') ? tag.slice(1) : tag;
}

export function getReleaseTypeBetweenTags(tag: string, previousTag?: string): ReleaseType {
  const [major, minor] = parseMajorAndMinor(tag);
  const [previousMajor, previousMinor] = parseMajorAndMinor(previousTag);

  if (major !== previousMajor) return 'major';
  if (minor !== previousMinor) return 'minor';
  return 'patch';
}

function parseMajorAndMinor(tag?: string): [number, number] {
  if (!tag) return [0, 0];
  const [
    major = 0,
    minor = 0,
  ] = parseSemverVersion(tag).split('.').map(Number);
  return [
    major,
    minor,
  ];
}
