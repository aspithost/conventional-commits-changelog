import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  type Options as ChangelogWriterPreset,
  writeChangelog as _writeChangelog,
} from 'conventional-changelog-writer';

import type { ValidatedCommit } from '../commits/validate-commits/types/commit.js';
import type { ReleaseType } from '../release/types/release.js';

import { createWriterPreset } from './presets/createWriterPreset.js';
import { getFormattedDate } from './utils/getFormattedDate.js';

export type { Options as ChangelogWriterPreset } from 'conventional-changelog-writer';

const VERSION_HEADER_PATTERN = /^##\s\d+\.\d+\.\d+/m;

/**
 * Identifies the remote repository used to generate links in changelog entries.
 */
interface RemoteRepositoryInformation {
  /** The remote host URL, such as `https://github.com`. */
  host: string;
  /** The repository owner's account or organization name. */
  owner: string;
  /** The repository name. */
  repository: string;
}

/**
 * Options for writing the changelog.
 */
export interface ChangelogWriterOptions {
  /** The `conventional-changelog-writer` preset that formats the changelog. */
  changelogWriterPreset: ChangelogWriterPreset;
  /** Repository details that the writer uses to build links to commits and compares. */
  remoteRepositoryInformation?: RemoteRepositoryInformation;
}

/**
 * Options for a single `writeChangelog` call.
 */
export interface WriteChangelogOptions {
  /**
   * The date shown in the entry header, formatted as `YYYY-MM-DD`.
   * @defaultValue today's date
   */
  date?: string;
  /**
   * The changelog filename inside the directory.
   * @defaultValue `'CHANGELOG.md'`
   */
  filename?: string;
}

export class ChangelogWriter {
  readonly #changelogWriterPreset: ChangelogWriterPreset;
  readonly #remoteRepositoryInformation: RemoteRepositoryInformation | undefined;

  constructor({
    changelogWriterPreset,
    remoteRepositoryInformation,
  }: ChangelogWriterOptions) {
    this.#changelogWriterPreset = changelogWriterPreset;
    this.#remoteRepositoryInformation = remoteRepositoryInformation;
  }

  static withDefaultPreset({
    remoteRepositoryInformation,
  }: Omit<ChangelogWriterOptions, 'changelogWriterPreset'> = {}): ChangelogWriter {
    const changelogWriterPreset = createWriterPreset();
    return new ChangelogWriter({
      changelogWriterPreset,
      remoteRepositoryInformation,
    });
  }

  async writeChangelog(
    directoryPath: string,
    newVersion: string,
    releaseType: ReleaseType,
    commits: Iterable<ValidatedCommit<string, string>>,
    { date = getFormattedDate(), filename = 'CHANGELOG.md' }: WriteChangelogOptions = {},
  ): Promise<void> {
    const changelogPath = join(directoryPath, filename);
    const currentContent = this.#readChangelog(changelogPath);
    const newEntry = await this.#createChangelogString(newVersion, releaseType, commits, date);
    const updatedContent = this.#insertChangelogEntry(currentContent, newEntry);
    this.#writeChangelogEntries(changelogPath, updatedContent);
  }

  #readChangelog(changelogPath: string): string {
    try {
      return readFileSync(changelogPath, 'utf-8');
    } catch (err) {
      throw new Error(`Error reading changelog at ${changelogPath}`, { cause: err });
    }
  }

  async #createChangelogString(
    newVersion: string,
    releaseType: ReleaseType,
    commits: Iterable<ValidatedCommit<string, string>>,
    date: string,
  ): Promise<string> {
    let changelogString = '';
    for await (
      const changelogChunk of this.#createChangelogEntry(newVersion, releaseType, commits, date)
    ) {
      changelogString += changelogChunk;
    }
    return changelogString;
  }

  #createChangelogEntry(
    newVersion: string,
    releaseType: ReleaseType,
    commits: Iterable<ValidatedCommit<string, string>>,
    date: string,
  ): AsyncGenerator<string, void, unknown> {
    const context = {
      date,
      isPatch: releaseType === 'patch',
      linkReferences: true,
      version: newVersion,
      ...this.#remoteRepositoryInformation,
    };

    try {
      return _writeChangelog(context, this.#changelogWriterPreset)(commits);
    } catch (err) {
      throw new Error('Error when creating a changelog entry', { cause: err });
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
      throw new Error(`Error writing changelog to ${changelogPath}`, { cause: err });
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
