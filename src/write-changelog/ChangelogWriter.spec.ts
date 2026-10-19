import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { writeChangelog } from 'conventional-changelog-writer';

import { ChangelogWriter, type ChangelogWriterPreset } from './ChangelogWriter.js';

import type { ValidatedCommit } from '@/commits/validate-commits/types/commit.js';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(() => ''),
  writeFileSync: vi.fn(),
}));

vi.mock('conventional-changelog-writer', () => ({
  writeChangelog: vi.fn(() => () => createChangelogChunks([
    '## 1.0.0\n\n',
    '### Features\n\n',
    '* add feature\n',
  ])),
}));

vi.mock('./presets/createWriterPreset', () => ({
  createWriterPreset: vi.fn(() => MOCK_WRITER_PRESET),
}));

vi.mock('./utils/getFormattedDate', () => ({
  getFormattedDate: vi.fn(() => '2024-01-15'),
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
} as unknown as ChangelogWriterPreset;
const DIRECTORY_PATH = '/path/to/package';
const CHANGELOG_PATH = join(DIRECTORY_PATH, 'CHANGELOG.md');

describe('ChangelogWriter', () => {
  beforeAll(() => {
    console.error = vi.fn();
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

      await writer.writeChangelog(
        DIRECTORY_PATH,
        '1.0.0',
        'minor',
        commits,
        { filename: 'HISTORY.md' },
      );

      expect(writeFileSync).toHaveBeenCalledWith(
        join(DIRECTORY_PATH, 'HISTORY.md'),
        expect.any(String),
        'utf-8',
      );
    });

    it('should use a custom date when provided', async () => {
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await writer.writeChangelog(
        DIRECTORY_PATH,
        '1.0.0',
        'minor',
        commits,
        { date: '2020-02-02' },
      );

      expect(writeChangelog).toHaveBeenCalledWith(
        expect.objectContaining({ date: '2020-02-02' }),
        expect.anything(),
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

    it(
      'should re-throw errors if the writeChangelog operation from fails',
      async () => {
        const someError = new Error('Some error');
        vi.mocked(writeChangelog).mockImplementationOnce(() => {
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
          .toThrow(expect.objectContaining({ cause: someError }));
      },
    );
  });

  describe('changelog content insertion', () => {
    it('should create new changelog when file is empty', async () => {
      vi.mocked(writeChangelog)
        .mockReturnValueOnce(() => createChangelogChunks(['## 1.0.0\n\n* feature\n']) as never);
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
      vi.mocked(readFileSync).mockReturnValueOnce('# Changelog\n\nAll notable changes.\n');
      vi.mocked(writeChangelog)
        .mockReturnValueOnce(() => createChangelogChunks(['## 1.0.0\n\n* feature\n']) as never);
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
      vi.mocked(readFileSync).mockReturnValueOnce('# Changelog\n\n## 1.0.0\n\n* old feature\n');
      vi.mocked(writeChangelog)
        .mockReturnValueOnce(() => createChangelogChunks(['## 2.0.0\n\n* new feature\n']) as never);
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
        .mockReturnValueOnce('# Changelog\n\n## 2.0.0\n\n* v2\n\n## 1.0.0\n\n* v1\n');
      vi.mocked(writeChangelog)
        .mockReturnValueOnce(() => createChangelogChunks(['## 3.0.0\n\n* v3\n']) as never);
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
      vi.mocked(readFileSync).mockReturnValueOnce('# Changelog\n\n## 1.0.0\n\n* feature\n\n\n');
      vi.mocked(writeChangelog)
        .mockReturnValueOnce(() => createChangelogChunks(['## 2.0.0\n\n* new\n']) as never);
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
      const err = new Error('ENOENT: no such file or directory');
      vi.mocked(readFileSync).mockImplementationOnce(() => {
        throw err;
      });
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await expect(writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits))
        .rejects.toThrow(expect.objectContaining({ cause: err }));
    });

    it('should throw when changelog file cannot be written', async () => {
      const err = new Error('EACCES: permission denied');
      vi.mocked(writeFileSync).mockImplementationOnce(() => {
        throw err;
      });
      const commits = createValidatedCommits([BASE_VALIDATED_COMMIT]);
      const writer = ChangelogWriter.withDefaultPreset();

      await expect(writer.writeChangelog(DIRECTORY_PATH, '1.0.0', 'minor', commits))
        .rejects.toThrow(expect.objectContaining({ cause: err }));
    });
  });
});
