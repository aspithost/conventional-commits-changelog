import { writeChangelog as _writeChangelog, type Context, type Options } from 'conventional-changelog-writer';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { createWriterPreset } from '@/write-changelog/presets/writer.js';
import { getFormattedDate } from '@/write-changelog/utils/getFormattedDate.js';

import type { ReleaseType } from '@/types/index.js';
import type { ValidatedCommits } from '@/shared/commits/validate-commits/types/commits.js';

const VERSION_HEADER_PATTERN = /^##\s\d+\.\d+\.\d+/m;

export interface RemoteRepositoryInformation {
  host: string;
  owner: string;
  repository: string;
}

export interface ChangelogWriterOptions {
  changelogWriterPreset: Options;
  remoteRepositoryInformation?: RemoteRepositoryInformation;
}

export type ChangelogWriterPreset = Options;

export class ChangelogWriter {
  readonly #changelogWriterPreset: ChangelogWriterPreset;
  readonly #remoteRepositoryInformation: RemoteRepositoryInformation | undefined;

  constructor(changelogWriterPreset: ChangelogWriterPreset, repositoryInformation?: RemoteRepositoryInformation) {
    this.#changelogWriterPreset = changelogWriterPreset;
    this.#remoteRepositoryInformation = repositoryInformation;
  }

  static async withDefaultPreset(
    repositoryInformation?: RemoteRepositoryInformation,
  ): Promise<ChangelogWriter> {
    const changelogWriterPreset = await createWriterPreset();
    return new ChangelogWriter(changelogWriterPreset, repositoryInformation);
  }

  async writeChangelog(
    directoryPath: string,
    newVersion: string,
    releaseType: ReleaseType,
    commits: ValidatedCommits<string, string>,
    filename = 'CHANGELOG.md',
  ): Promise<void> {
    const changelogPath = join(directoryPath, filename);
    const currentContent = this.readChangelog(changelogPath);
    const newEntry = await this.createChangelogString(newVersion, releaseType, commits);
    const updatedContent = this.insertChangelogEntry(currentContent, newEntry);
    this.writeChangelogEntries(changelogPath, updatedContent);
  }

  private readChangelog(changelogPath: string): string {
    try {
      return readFileSync(changelogPath, 'utf-8');
    } catch (err) {
      console.error(`Error reading changelog at ${changelogPath}:`, err);
      throw err;
    }
  }

  private async createChangelogString(
    newVersion: string,
    releaseType: ReleaseType,
    commits: ValidatedCommits<string, string>,
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
    commits: ValidatedCommits<string, string>,
  ): AsyncGenerator<string, void, unknown> {
    const context = {
      date: getFormattedDate(),
      isPatch: releaseType === 'patch',
      linkReferences: true,
      version: newVersion,
      ...this.#remoteRepositoryInformation,
    } satisfies Context;

    try {
      return _writeChangelog(context, this.#changelogWriterPreset)(commits);
    } catch (err) {
      console.error('Error creating changelog entry:', err);
      throw err;
    }
  }

  private insertChangelogEntry(currentContent: string, newEntry: string): string {
    const versionHeaderIndex = this.findVersionHeaderIndex(currentContent);
    const trimmedEntry = newEntry.trim();

    if (versionHeaderIndex === -1) {
      return this.insertAsFirstEntry(currentContent, trimmedEntry);
    }

    return this.insertBeforeExistingVersions(currentContent, trimmedEntry, versionHeaderIndex);
  }

  private writeChangelogEntries(changelogPath: string, updatedContent: string): void {
    try {
      writeFileSync(changelogPath, updatedContent, 'utf-8');
    } catch (err) {
      console.error(`Error writing changelog to ${changelogPath}:`, err);
      throw err;
    }
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
