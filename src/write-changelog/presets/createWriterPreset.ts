import createPreset from 'conventional-changelog-conventionalcommits';
import type { FinalOptions, Options } from 'conventional-changelog-writer';

import { COMMIT_TYPES } from './constants/writer.js';
import {
  type Commit,
  type Context,
  formatCommitUrl as _formatCommitUrl,
} from './utils/formatCommitUrl.js';

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
