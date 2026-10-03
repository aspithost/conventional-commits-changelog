import createPreset from 'conventional-changelog-conventionalcommits';
import type { FinalOptions, Options } from 'conventional-changelog-writer';

import {
  type Commit,
  type Context,
  formatCommitUrl as _formatCommitUrl,
} from './utils/formatCommitUrl.js';

import { COMMIT_TYPES } from '@/write-changelog/presets/constants/writer.js';

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
