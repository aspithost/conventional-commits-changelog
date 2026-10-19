import type { ReleaseType } from '../../../release/types/release.js';

export function parseSemverVersion(version: string): string {
  return version.startsWith('v') ? version.slice(1) : version;
}

export function getReleaseTypeBetweenTags(
  targetVersion: string,
  previousVersion?: string,
): ReleaseType {
  const [major, minor] = parseMajorAndMinor(targetVersion);
  const [previousMajor, previousMinor] = parseMajorAndMinor(previousVersion);

  if (major !== previousMajor) return 'major';
  if (minor !== previousMinor) return 'minor';
  return 'patch';
}

function parseMajorAndMinor(version?: string): [number, number] {
  if (!version) return [0, 0];
  const [
    major = 0,
    minor = 0,
  ] = parseSemverVersion(version).split('.').map(Number);
  return [
    major,
    minor,
  ];
}
