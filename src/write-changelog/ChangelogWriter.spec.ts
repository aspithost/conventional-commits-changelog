import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { writeChangelog } from 'conventional-changelog-writer';

import { ChangelogWriter } from './ChangelogWriter.js';

import type { ValidatedCommit } from '@/commits/validate-commits/types/commit.js';
import { createWriterPreset } from '@/write-changelog/presets/createWriterPreset.js';
import { getFormattedDate } from '@/write-changelog/utils/getFormattedDate.js';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('conventional-changelog-writer', () => ({
  writeChangelog: vi.fn(),
}));

vi.mock('./presets/createWriterPreset', () => ({
  createWriterPreset: vi.fn(),
}));

vi.mock('./utils/getFormattedDate', () => ({
  getFormattedDate: vi.fn(),
}));

type ValidatedCommits = Iterable<ValidatedCommit<string, string>>;
function* createValidatedCommits(commits: ValidatedCommits): ValidatedCommits {
  yield* commits;
}

function* createChangelogChunks(chunks: string[]): Generator<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

const BASE_VALIDATED_COMMIT = {
  hash: 'abc123',
  merge: null,
  revert: null,
  header: 'feat(core): add feature',
  body: null,
  footer: null,
  notes: [],
  mentions: [],
  references: [],
  scope: 'core',
  subject: 'add feature',
  type: 'feat',
} satisfies ValidatedCommit<string, string>;

const MOCK_WRITER_PRESET = {
  headerPartial: '',
  commitPartial: '',
  footerPartial: '',
};
const DIRECTORY_PATH = '/path/to/package';
const CHANGELOG_PATH = join(DIRECTORY_PATH, 'CHANGELOG.md');

describe('ChangelogWriter', () => {
  beforeAll(() => {
    console.error = vi.fn();
  });

  beforeEach(() => {
    vi.mocked(createWriterPreset).mockReturnValue(MOCK_WRITER_PRESET as never);
    vi.mocked(getFormattedDate).mockReturnValue('2024-01-15');
    vi.mocked(readFileSync).mockReturnValue('');
    vi.mocked(writeChangelog)
      .mockReturnValue(() => createChangelogChunks([
        '## 1.0.0\n\n',
        '### Features\n\n',
        '* add feature\n',
      ]) as never);
  });

  describe('factory methods', () => {
    it('should create instance with default preset', () => {
      const writer = ChangelogWriter.withDefaultPreset();

      expect(writer).toBeInstanceOf(ChangelogWriter);
    });
  });

  describe('writeChangelog', () => {
    it('should write changelog entries to the correct path', async () => {
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits);

      expect(writeFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        expect.any(String),
        'utf-8',
      );
    });

    it('should use a custom filename when provided', async () => {
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits, 'HISTORY.md');

      expect(writeFileSync).toHaveBeenCalledWith(
        join(DIRECTORY_PATH, 'HISTORY.md'),
        expect.any(String),
        'utf-8',
      );
    });

    it('should pass correct context to writeChangelog', async () => {
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '2.0.0', 'major', commits);

      expect(writeChangelog).toHaveBeenCalledWith(
        {
          date: '2024-01-15',
          isPatch: false,
          linkReferences: true,
          version: '2.0.0',
        },
        MOCK_WRITER_PRESET,
      );
    });

    it('should set isPatch to true for patch releases', async () => {
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '1.0.1', 'patch', commits);

      expect(writeChangelog).toHaveBeenCalledWith(
        expect.objectContaining({ isPatch: true }),
        MOCK_WRITER_PRESET,
      );
    });

    it('should re-throw errors if the writeChangelog operation from fails',
      async () => {
        const someError = new Error('Some error');
        vi.mocked(writeChangelog).mockImplementation(() => {
          throw someError;
        });
        const writer = ChangelogWriter.withDefaultPreset();

        await expect(writer.writeChangelog(
          DIRECTORY_PATH,
          '1.0.1',
          'patch',
          [BASE_VALIDATED_COMMIT],
        ))
          .rejects
          .toThrow(someError);
      },
    );
  });

  describe('changelog content insertion', () => {
    it('should create new changelog when file is empty', async () => {
      vi.mocked(writeChangelog)
        .mockReturnValue(() => createChangelogChunks(['## 1.0.0\n\n* feature\n']) as never);
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits);

      expect(writeFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        '## 1.0.0\n\n* feature\n',
        'utf-8',
      );
    });

    it('should append entry after header when no versions exist', async () => {
      vi.mocked(readFileSync).mockReturnValue('# Changelog\n\nAll notable changes.\n');
      vi.mocked(writeChangelog)
        .mockReturnValue(() => createChangelogChunks(['## 1.0.0\n\n* feature\n']) as never);
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits);

      expect(writeFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        '# Changelog\n\nAll notable changes.\n\n## 1.0.0\n\n* feature\n',
        'utf-8',
      );
    });

    it('should insert entry before existing versions', async () => {
      vi.mocked(readFileSync).mockReturnValue('# Changelog\n\n## 1.0.0\n\n* old feature\n');
      vi.mocked(writeChangelog)
        .mockReturnValue(() => createChangelogChunks(['## 2.0.0\n\n* new feature\n']) as never);
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '2.0.0', 'major', commits);

      expect(writeFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        '# Changelog\n\n## 2.0.0\n\n* new feature\n\n## 1.0.0\n\n* old feature\n',
        'utf-8',
      );
    });

    it('should handle multiple existing versions', async () => {
      vi.mocked(readFileSync)
        .mockReturnValue('# Changelog\n\n## 2.0.0\n\n* v2\n\n## 1.0.0\n\n* v1\n');
      vi.mocked(writeChangelog)
        .mockReturnValue(() => createChangelogChunks(['## 3.0.0\n\n* v3\n']) as never);
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '3.0.0', 'major', commits);

      expect(writeFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        '# Changelog\n\n## 3.0.0\n\n* v3\n\n## 2.0.0\n\n* v2\n\n## 1.0.0\n\n* v1\n',
        'utf-8',
      );
    });

    it('should handle changelog with trailing whitespace', async () => {
      vi.mocked(readFileSync).mockReturnValue('# Changelog\n\n## 1.0.0\n\n* feature\n\n\n');
      vi.mocked(writeChangelog)
        .mockReturnValue(() => createChangelogChunks(['## 2.0.0\n\n* new\n']) as never);
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '2.0.0', 'major', commits);

      expect(writeFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        '# Changelog\n\n## 2.0.0\n\n* new\n\n## 1.0.0\n\n* feature\n',
        'utf-8',
      );
    });
  });

  describe('error handling', () => {
    it('should throw when the changelog file cannot be read', async () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await expect(writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits))
        .rejects.toThrow('ENOENT: no such file or directory');
    });

    it('should throw when changelog file cannot be written', async () => {
      vi.mocked(writeFileSync).mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await expect(writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits))
        .rejects.toThrow('EACCES: permission denied');
    });
  });
});
