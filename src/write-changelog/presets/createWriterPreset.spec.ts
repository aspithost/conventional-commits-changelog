import createPreset from 'conventional-changelog-conventionalcommits';

import { COMMIT_TYPES } from './constants/writer.js';
import { createWriterPreset } from './createWriterPreset.js';
import { formatCommitUrl } from './utils/formatCommitUrl.js';

const REMOTE_REPOSITORY_INFORMATION = {
  host: 'https://github.com',
  owner: 'user',
  repository: 'repo',
};

const FORMAT_COMMIT_URL_CONTEXT = vi.hoisted(() => ({ some: 'context' }));
const FORMAT_COMMIT_URL_COMMIT = vi.hoisted(() => ({ some: 'commit' }));
vi.mock('conventional-changelog-conventionalcommits', () => ({
  default: vi.fn((config: { formatCommitUrl?: (...args: unknown[]) => unknown }) => {
    config.formatCommitUrl?.(FORMAT_COMMIT_URL_CONTEXT, FORMAT_COMMIT_URL_COMMIT);

    return { writer: {} };
  }),
}));

vi.mock('./utils/formatCommitUrl.js', () => ({
  formatCommitUrl: vi.fn(),
}));

describe('createWriterPreset', () => {
  it('should create the write preset with default commit types', () => {
    createWriterPreset();

    expect(createPreset).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      types: COMMIT_TYPES,
    }));
  });

  it('should format commit URLs when the user provides repository information', () => {
    createWriterPreset(REMOTE_REPOSITORY_INFORMATION);

    expect(createPreset).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      formatCommitUrl: expect.any(Function),
    }));
    expect(formatCommitUrl)
      .toHaveBeenCalledWith(FORMAT_COMMIT_URL_CONTEXT, FORMAT_COMMIT_URL_COMMIT);
  });

  it('should omit commit URL formatting when repository information does not exist', () => {
    createWriterPreset();

    expect(createPreset).toHaveBeenCalledOnce();
    expect(formatCommitUrl).not.toHaveBeenCalled();
  });
});
