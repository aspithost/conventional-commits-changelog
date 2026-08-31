import createPreset from 'conventional-changelog-conventionalcommits';
import type { FinalOptions, Options } from 'conventional-changelog-writer';

import { COMMIT_TYPES } from '@/write-changelog/presets/constants/writer.js';
import { formatCommitUrl as _formatCommitUrl, type Commit, type Context } from './utils/formatCommitUrl.js';

export function createWriterPreset(config?: Options): FinalOptions {
  const { writer } = createPreset({
    formatCommitUrl (context: Context, commit: Commit) {
      return _formatCommitUrl(context, commit);
    },
    types: COMMIT_TYPES,
    ...config,
  });

  return writer;
}
