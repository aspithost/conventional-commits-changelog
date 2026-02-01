import { writeChangelog, type Context, type Options } from 'conventional-changelog-writer';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createWriterPreset } from '@/presets/writer.js';
import { getFormattedDate } from '@/utils/getFormattedDate.js';

import type { CommitSchema } from '@/schemas/commit.js';
import type { ReleaseType } from '@/types/index.js';

export class ChangelogWriter<T extends string, U extends string> {
  private readonly changelogWriterPreset: Options;
  private readonly rootFolderPath: string;

  constructor({
    changelogWriterPreset,
    rootFolderPath = join(process.cwd(), 'packages'),
  }: {
    changelogWriterPreset: Options;
    rootFolderPath?: string;
  }) {
    this.changelogWriterPreset = changelogWriterPreset;
    this.rootFolderPath = rootFolderPath;
  }

  static async withDefaultPreset<T extends string, U extends string>(rootFolderPath?: string) {
    const preset = await createWriterPreset();
    return new ChangelogWriter<T, U>({ changelogWriterPreset: preset, rootFolderPath });
  }

  async writeChangelog(
    folderPath: string,
    newVersion: string,
    releaseType: ReleaseType,
    commits: CommitSchema<T, U>[],
    filename: string = 'CHANGELOG.md',
  ) {
    const changelogPath = join(this.rootFolderPath, folderPath, filename);
    const currentChangelogContent = readFileSync(changelogPath, 'utf-8');

    const changelogEntry = await this.createChangelogString(newVersion, releaseType, commits);
    // Finds the top entry in CHANGELOG.md
    const currentVersionIndex = currentChangelogContent.search(/^##\s\d+\.\d+\.\d+/m);

    let updatedChangelogContent: string;

    if (currentVersionIndex === -1) {
      updatedChangelogContent = `${currentChangelogContent.trim()}\n\n${changelogEntry.trim()}`;
    } else {
      const before = currentChangelogContent.slice(0, currentVersionIndex).trimEnd();
      const after = currentChangelogContent.slice(currentVersionIndex);
      updatedChangelogContent = `${before}\n${changelogEntry.trim()}\n\n${after}`;
    }

    writeFileSync(changelogPath, updatedChangelogContent, 'utf-8');
  }

  private async createChangelogString(
    newVersion: string,
    releaseType: ReleaseType,
    commits: CommitSchema<T, U>[],
  ): Promise<string> {
    let changelogString = '';
    for await(const changelogChunk of this.createChangelogEntry(newVersion, releaseType, commits)) {
      changelogString += changelogChunk;
    }
    return changelogString;
  }

  private createChangelogEntry(
    newVersion: string,
    releaseType: ReleaseType,
    commits: CommitSchema<T, U>[],
  ): AsyncGenerator<string, void, unknown> {
    const context = {
      version: newVersion,
      isPatch: releaseType === 'patch',
      date: getFormattedDate(),
    } satisfies Context;

    return writeChangelog(context, this.changelogWriterPreset)(commits);
  }
}
