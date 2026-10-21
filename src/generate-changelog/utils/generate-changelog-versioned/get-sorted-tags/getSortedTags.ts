import { _execFileSync } from '../../../../utils/node/execFileSync.js';

const VERSION_TAG_PATTERN = /^(?:v|.+@)?\d+\.\d+\.\d+$/;

// to-do: add note to documentation that this only supports sorting on whole ref name
export function getSortedTags(
  branch: string,
  cwd: string,
): string[] {
  try {
    return _execFileSync(
      'git',
      [
        'tag',
        '--list',
        '--merged',
        branch,
        '--sort=v:refname',
      ],
      cwd,
    )
      .split('\n')
      .filter(tag => VERSION_TAG_PATTERN.test(tag));
  } catch (err) {
    throw new Error(`Could not retrieve sorted tags for branch: ${branch}`, { cause: err });
  }
}
