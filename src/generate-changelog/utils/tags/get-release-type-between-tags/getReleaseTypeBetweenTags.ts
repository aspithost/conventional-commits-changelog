import type { ReleaseType } from '../../../../release/schemas/release.js';

export function getReleaseTypeBetweenTags(
  targetVersion: string,
  previousVersion?: string,
): ReleaseType {
  const [major, minor] = parseMajorAndMinorFromTag(targetVersion);
  const [previousMajor, previousMinor] = parseMajorAndMinorFromTag(previousVersion);

  if (major > previousMajor) return 'major';
  if (minor > previousMinor) return 'minor';
  return 'patch';
}

const CAPTURING_GROUPS_REGEX = /(?<major>\d+)\.(?<minor>\d+)/;

function parseMajorAndMinorFromTag(tag?: string): [number, number] {
  if (!tag) return [0, 0];
  const { major = '0', minor = '0' } = CAPTURING_GROUPS_REGEX.exec(tag)?.groups ?? {};
  return [Number(major), Number(minor)];
}
