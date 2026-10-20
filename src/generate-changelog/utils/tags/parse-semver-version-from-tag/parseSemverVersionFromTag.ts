export function parseSemverVersionFromTag(tag: string): string {
  return /(?<![\d.])\d+\.\d+\.\d+$/.exec(tag)?.[0] ?? tag;
}
