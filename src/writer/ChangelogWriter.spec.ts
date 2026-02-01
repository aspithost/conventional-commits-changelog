import { writeChangelog } from 'conventional-changelog-writer';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ValidatedCommit, ValidatedCommits } from '@/commits/validator/CommitsValidator.js';
import { createWriterPreset } from '@/presets/writer.js';
import { getFormattedDate } from '@/utils/getFormattedDate.js';

import { ChangelogWriter } from './ChangelogWriter.js';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('conventional-changelog-writer', () => ({
  writeChangelog: vi.fn(),
}));

vi.mock('@/presets/writer.js', () => ({
  createWriterPreset: vi.fn(),
}));

vi.mock('@/utils/getFormattedDate.js', () => ({
  getFormattedDate: vi.fn(),
}));

const mockCreateWriterPreset = vi.mocked(createWriterPreset);
const mockGetFormattedDate = vi.mocked(getFormattedDate);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockWriteChangelog = vi.mocked(writeChangelog);

function* createValidatedCommits(commits: ValidatedCommit<string, string>[]): ValidatedCommits<string, string> {
  yield* commits;
}

async function* createChangelogChunks(chunks: string[]): AsyncGenerator<string> {
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

const MOCK_WRITER_PRESET = { headerPartial: '', commitPartial: '', footerPartial: '' };
const DIRECTORY_PATH = '/path/to/package';
const CHANGELOG_PATH = join(DIRECTORY_PATH, 'CHANGELOG.md');

describe('ChangelogWriter', () => {
  beforeEach(() => {
    mockCreateWriterPreset.mockResolvedValue(MOCK_WRITER_PRESET as never);
    mockGetFormattedDate.mockReturnValue('2024-01-15');
    mockReadFileSync.mockReturnValue('');
    mockWriteChangelog.mockReturnValue(() => createChangelogChunks(['## 1.0.0\n\n', '### Features\n\n', '* add feature\n']));
  });

  describe('factory methods', () => {
    it('should create instance with default preset', async () => {
      const writer = await ChangelogWriter.withDefaultPreset();

      expect(writer).toBeInstanceOf(ChangelogWriter);
    });

    it('should create instance with custom preset', async () => {
      const customPreset = await createWriterPreset()

      const writer = ChangelogWriter.withCustomPreset(customPreset);

      expect(writer).toBeInstanceOf(ChangelogWriter);
    });
  });

  describe('writeChangelog', () => {
    it('should write changelog to the correct path', async () => {
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        expect.any(String),
        'utf-8',
      );
    });

    it('should use custom filename when provided', async () => {
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits, 'HISTORY.md');

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(DIRECTORY_PATH, 'HISTORY.md'),
        expect.any(String),
        'utf-8',
      );
    });

    it('should pass correct context to writeChangelog', async () => {
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '2.0.0', 'major', commits);

      expect(mockWriteChangelog).toHaveBeenCalledWith(
        { version: '2.0.0', isPatch: false, date: '2024-01-15' },
        MOCK_WRITER_PRESET,
      );
    });

    it('should set isPatch to true for patch releases', async () => {
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '1.0.1', 'patch', commits);

      expect(mockWriteChangelog).toHaveBeenCalledWith(
        expect.objectContaining({ isPatch: true }),
        MOCK_WRITER_PRESET
      );
    });
  });

  describe('changelog content insertion', () => {
    it('should create new changelog when file is empty', async () => {
      mockReadFileSync.mockReturnValue('');
      mockWriteChangelog.mockReturnValue(() => createChangelogChunks(['## 1.0.0\n\n* feature\n']));
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        '## 1.0.0\n\n* feature\n',
        'utf-8',
      );
    });

    it('should append entry after header when no versions exist', async () => {
      mockReadFileSync.mockReturnValue('# Changelog\n\nAll notable changes.\n');
      mockWriteChangelog.mockReturnValue(() => createChangelogChunks(['## 1.0.0\n\n* feature\n']));
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        '# Changelog\n\nAll notable changes.\n\n## 1.0.0\n\n* feature\n',
        'utf-8',
      );
    });

    it('should insert entry before existing versions', async () => {
      mockReadFileSync.mockReturnValue('# Changelog\n\n## 1.0.0\n\n* old feature\n');
      mockWriteChangelog.mockReturnValue(() => createChangelogChunks(['## 2.0.0\n\n* new feature\n']));
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '2.0.0', 'major', commits);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        '# Changelog\n\n## 2.0.0\n\n* new feature\n\n## 1.0.0\n\n* old feature\n',
        'utf-8',
      );
    });

    it('should handle multiple existing versions', async () => {
      mockReadFileSync.mockReturnValue('# Changelog\n\n## 2.0.0\n\n* v2\n\n## 1.0.0\n\n* v1\n');
      mockWriteChangelog.mockReturnValue(() => createChangelogChunks(['## 3.0.0\n\n* v3\n']));
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '3.0.0', 'major', commits);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        '# Changelog\n\n## 3.0.0\n\n* v3\n\n## 2.0.0\n\n* v2\n\n## 1.0.0\n\n* v1\n',
        'utf-8',
      );
    });

    it('should handle changelog with trailing whitespace', async () => {
      mockReadFileSync.mockReturnValue('# Changelog\n\n## 1.0.0\n\n* feature\n\n\n');
      mockWriteChangelog.mockReturnValue(() => createChangelogChunks(['## 2.0.0\n\n* new\n']));
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(DIRECTORY_PATH, '2.0.0', 'major', commits);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        CHANGELOG_PATH,
        '# Changelog\n\n## 2.0.0\n\n* new\n\n## 1.0.0\n\n* feature\n',
        'utf-8',
      );
    });
  });

  describe('error handling', () => {
    it('should throw when the changelog file cannot be read', async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await expect(writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits))
        .rejects.toThrow('ENOENT: no such file or directory');
    });

    it('should throw when changelog file cannot be written', async () => {
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = await ChangelogWriter.withDefaultPreset();

      await expect(writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits))
        .rejects.toThrow('EACCES: permission denied');
    });
  });
});
