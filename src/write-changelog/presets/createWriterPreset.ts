import createPreset from 'conventional-changelog-conventionalcommits';
import type { FinalOptions } from 'conventional-changelog-writer';

import type { RemoteRepositoryInformation } from '../schemas/changelogWriterOptions.js';

import { COMMIT_TYPES } from './constants/writer.js';
import {
  type Commit,
  type Context,
  formatCommitUrl as _formatCommitUrl,
} from './utils/formatCommitUrl.js';

export function createWriterPreset(
  remoteRepositoryInformation?: RemoteRepositoryInformation,
): FinalOptions {
  const { writer } = createPreset({
    types: COMMIT_TYPES,
    ...!!remoteRepositoryInformation && {
      formatCommitUrl (context: Context, commit: Commit) {
        return _formatCommitUrl(context, commit);
      },
    },
  });

  return writer;
}
