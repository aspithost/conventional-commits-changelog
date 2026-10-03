import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  type Options as ChangelogWriterPreset,
  writeChangelog as _writeChangelog,
} from 'conventional-changelog-writer';

import type { ValidatedCommit } from '@/commits/validate-commits/types/commit.js';
import type { ReleaseType } from '@/release/types/release.js';
import { type ErrorHandler, logError } from '@/utils/error/logError.js';
import { createWriterPreset } from '@/write-changelog/presets/createWriterPreset.js';
import { getFormattedDate } from '@/write-changelog/utils/getFormattedDate.js';

export type { Options as ChangelogWriterPreset } from 'conventional-changelog-writer';

const VERSION_HEADER_PATTERN = /^##\s\d+\.\d+\.\d+/m;

interface RemoteRepositoryInformation {
  host: string;
  owner: string;
  repository: string;
}

export interface ChangelogWriterOptions {
  changelogWriterPreset: ChangelogWriterPreset;
  options?: {
    remoteRepositoryInformation?: RemoteRepositoryInformation;
    onError?: ErrorHandler;
  };
}

export class ChangelogWriter {
  readonly #changelogWriterPreset: ChangelogWriterPreset;
  readonly #remoteRepositoryInformation: RemoteRepositoryInformation | undefined;
  readonly #onError: ErrorHandler;

  constructor(changelogWriterPreset: ChangelogWriterPreset, {
    remoteRepositoryInformation,
    onError = logError,
  }: {
    remoteRepositoryInformation?: RemoteRepositoryInformation;
    onError?: ErrorHandler;
  } = {}) {
    this.#changelogWriterPreset = changelogWriterPreset;
    this.#remoteRepositoryInformation = remoteRepositoryInformation;
    this.#onError = onError;
  }

  static withDefaultPreset(
    remoteRepositoryInformation?: RemoteRepositoryInformation,
    onError: ErrorHandler = logError,
  ): ChangelogWriter {
    const changelogWriterPreset = createWriterPreset();
    return new ChangelogWriter(changelogWriterPreset, {
      remoteRepositoryInformation,
      onError,
    });
  }

  async writeChangelog(
    directoryPath: string,
    newVersion: string,
    releaseType: ReleaseType,
    commits: Iterable<ValidatedCommit<string, string>>,
    filename = 'CHANGELOG.md',
  ): Promise<void> {
    const changelogPath = join(directoryPath, filename);
    const currentContent = this.#readChangelog(changelogPath);
    const newEntry = await this.#createChangelogString(newVersion, releaseType, commits);
    const updatedContent = this.#insertChangelogEntry(currentContent, newEntry);
    this.#writeChangelogEntries(changelogPath, updatedContent);
  }

  #readChangelog(changelogPath: string): string {
    try {
      return readFileSync(changelogPath, 'utf-8');
    } catch (err) {
      this.#onError(`Error reading changelog at ${changelogPath}:`, err);
      throw err;
    }
  }

  async #createChangelogString(
    newVersion: string,
    releaseType: ReleaseType,
    commits: Iterable<ValidatedCommit<string, string>>,
  ): Promise<string> {
    let changelogString = '';
    for await (
      const changelogChunk of this.#createChangelogEntry(newVersion, releaseType, commits)
    ) {
      changelogString += changelogChunk;
    }
    return changelogString;
  }

  #createChangelogEntry(
    newVersion: string,
    releaseType: ReleaseType,
    commits: Iterable<ValidatedCommit<string, string>>,
  ): AsyncGenerator<string, void, unknown> {
    const context = {
      date: getFormattedDate(),
      isPatch: releaseType === 'patch',
      linkReferences: true,
      version: newVersion,
      ...this.#remoteRepositoryInformation,
    };

    try {
      return _writeChangelog(context, this.#changelogWriterPreset)(commits);
    } catch (err) {
      this.#onError('Error creating changelog entry:', err);
      throw err;
    }
  }

  #insertChangelogEntry(currentContent: string, newEntry: string): string {
    const versionHeaderIndex = this.#findVersionHeaderIndex(currentContent);
    const trimmedEntry = newEntry.trim();

    if (versionHeaderIndex === -1) {
      return this.#insertAsFirstEntry(currentContent, trimmedEntry);
    }

    return this.#insertBeforeExistingVersions(currentContent, trimmedEntry, versionHeaderIndex);
  }

  #writeChangelogEntries(changelogPath: string, updatedContent: string): void {
    try {
      writeFileSync(changelogPath, updatedContent, 'utf-8');
    } catch (err) {
      this.#onError(`Error writing changelog to ${changelogPath}:`, err);
      throw err;
    }
  }

  #findVersionHeaderIndex(content: string): number {
    return content.search(VERSION_HEADER_PATTERN);
  }

  #insertAsFirstEntry(currentContent: string, newEntry: string): string {
    const header = currentContent.trim();
    if (!header) {
      return `${newEntry}\n`;
    }
    return `${header}\n\n${newEntry}\n`;
  }

  #insertBeforeExistingVersions(
    currentContent: string,
    newEntry: string,
    versionHeaderIndex: number,
  ): string {
    const before = currentContent.slice(0, versionHeaderIndex).trimEnd();
    const after = currentContent.slice(versionHeaderIndex).trimEnd();
    return `${before}\n\n${newEntry}\n\n${after}\n`;
  }
}
