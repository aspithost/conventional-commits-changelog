import createPreset from 'conventional-changelog-conventionalcommits';

import { COMMIT_TYPES } from './constants/writer.js';
import { createWriterPreset } from './createWriterPreset.js';
import { formatCommitUrl } from './utils/formatCommitUrl.js';

vi.mock('conventional-changelog-conventionalcommits', () => ({
  default: vi.fn((config: { formatCommitUrl: (...args: unknown[]) => void }) => {
    config.formatCommitUrl({ some: 'context' }, { some: 'commit' });
    return { writer: {} };
  }),
}));

vi.mock('./utils/formatCommitUrl.js', () => ({
  formatCommitUrl: vi.fn(),
}));

describe('createWriterPreset', () => {
  it('should create a writer preset with commit URL formatting and commit types', () => {
    createWriterPreset();

    expect(createPreset).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        formatCommitUrl: expect.any(Function),
        types: COMMIT_TYPES,
      }),
    );

    // this only passes if line 10 actually ran
    expect(formatCommitUrl).toHaveBeenCalledWith(
      { some: 'context' },
      { some: 'commit' },
    );
  });
});
