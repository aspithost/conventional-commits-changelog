import type { VersionBumper } from '@/bumper/VersionBumper.js';
import { ChangelogWriter } from '@/writer/ChangelogWriter.js';


export class VersionUpdater<T extends string, U extends string> {
  private readonly versionBumpers: Map<T, VersionBumper<T, U>>;
  private readonly changelogWriter: ChangelogWriter<T, U>;

  private constructor(
    versionBumpers: Map<T, VersionBumper<T, U>>,
    changelogWriter: ChangelogWriter<T, U>,
  ) {
    this.versionBumpers = versionBumpers;
    this.changelogWriter = changelogWriter;
  }

  static async init<T extends string, U extends string>(): Promise<VersionUpdater<T, U>> {
    const versionBumpers = new Map<T, VersionBumper<T, U>>();
    const changelogWriter = await ChangelogWriter.withDefaultPreset<T, U>();
    return new VersionUpdater(versionBumpers, changelogWriter);
  }

  async updateVersions() {
    // to-do: this function should retrieve commits, parse and validate commits, determine version bumps per scope, and write changelogs per scope
  }
}
