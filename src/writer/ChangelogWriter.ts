import { writeChangelog, type Context, type Options } from 'conventional-changelog-writer';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createWriterPreset } from '@/presets/writer.js';
import { getFormattedDate } from '@/utils/getFormattedDate.js';

import type { ValidatedCommits } from '@/commits/validator/CommitsValidator.js';
import type { ReleaseType } from '@/types/index.js';

const VERSION_HEADER_PATTERN = /^##\s\d+\.\d+\.\d+/m;

export interface RemoteRepositoryInformation {
  host: string;
  owner: string;
  repository: string;
}

export class ChangelogWriter<T extends string, U extends string> {
  readonly #changelogWriterPreset: Options;
  readonly #remoteRepositoryInformation: RemoteRepositoryInformation | undefined;

  constructor(changelogWriterPreset: Options, repositoryInformation?: RemoteRepositoryInformation) {
    this.#changelogWriterPreset = changelogWriterPreset;
    this.#remoteRepositoryInformation = repositoryInformation;
  }

  static async withDefaultPreset<T extends string, U extends string>(
    repositoryInformation?: RemoteRepositoryInformation,
  ): Promise<ChangelogWriter<T, U>> {
    const changelogWriterPreset = await createWriterPreset();
    return new ChangelogWriter<T, U>(changelogWriterPreset, repositoryInformation);
  }

  static withCustomPreset<T extends string, U extends string>(
    changelogWriterPreset: Options,
    repositoryInformation?: RemoteRepositoryInformation,
  ): ChangelogWriter<T, U> {
    return new ChangelogWriter<T, U>(changelogWriterPreset, repositoryInformation);
  }

  async writeChangelog(
    directoryPath: string,
    newVersion: string,
    releaseType: ReleaseType,
    commits: ValidatedCommits<T, U>,
    filename = 'CHANGELOG.md',
  ): Promise<void> {
    const changelogPath = join(directoryPath, filename);
    const currentContent = this.readChangelog(changelogPath);
    const newEntry = await this.createChangelogString(newVersion, releaseType, commits);
    const updatedContent = this.insertChangelogEntry(currentContent, newEntry);
    writeFileSync(changelogPath, updatedContent, 'utf-8');
  }

  private readChangelog(changelogPath: string): string {
    return readFileSync(changelogPath, 'utf-8');
  }

  private async createChangelogString(
    newVersion: string,
    releaseType: ReleaseType,
    commits: ValidatedCommits<T, U>,
  ): Promise<string> {
    let changelogString = '';
    for await (const changelogChunk of this.createChangelogEntry(newVersion, releaseType, commits)) {
      changelogString += changelogChunk;
    }
    return changelogString;
  }

  private createChangelogEntry(
    newVersion: string,
    releaseType: ReleaseType,
    commits: ValidatedCommits<T, U>,
  ): AsyncGenerator<string, void, unknown> {
    const context = {
      date: getFormattedDate(),
      isPatch: releaseType === 'patch',
      linkReferences: true,
      version: newVersion,
      ...this.#remoteRepositoryInformation,
    } satisfies Context;

    return writeChangelog(context, this.#changelogWriterPreset)(commits);
  }

  private insertChangelogEntry(currentContent: string, newEntry: string): string {
    const versionHeaderIndex = this.findVersionHeaderIndex(currentContent);
    const trimmedEntry = newEntry.trim();

    if (versionHeaderIndex === -1) {
      return this.insertAsFirstEntry(currentContent, trimmedEntry);
    }

    return this.insertBeforeExistingVersions(currentContent, trimmedEntry, versionHeaderIndex);
  }

  private findVersionHeaderIndex(content: string): number {
    return content.search(VERSION_HEADER_PATTERN);
  }

  private insertAsFirstEntry(currentContent: string, newEntry: string): string {
    const header = currentContent.trim();
    if (!header) {
      return `${newEntry}\n`;
    }
    return `${header}\n\n${newEntry}\n`;
  }

  private insertBeforeExistingVersions(
    currentContent: string,
    newEntry: string,
    versionHeaderIndex: number,
  ): string {
    const before = currentContent.slice(0, versionHeaderIndex).trimEnd();
    const after = currentContent.slice(versionHeaderIndex).trimEnd();
    return `${before}\n\n${newEntry}\n\n${after}\n`;
  }
}
