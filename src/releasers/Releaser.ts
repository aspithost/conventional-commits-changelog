import { VersionBumper } from '@/bumper/versionBumper.js';
import { CommitsParser } from '@/commits/parser/CommitsParser.js';
import { CommitsRetriever } from '@/commits/retriever/CommitsRetriever.js';
import { CommitsValidator, type DefaultAllowedTypes, type ValidatedCommits } from '@/commits/validator/CommitsValidator.js';
import { ChangelogWriter, type RemoteRepositoryInformation } from '@/writer/ChangelogWriter.js';

export class Releaser {
  static async release(remoteRepositoryInformation?: RemoteRepositoryInformation): Promise<void> {
    const path = process.cwd();
    const bumperResult = VersionBumper.bumpVersion(
      path,
      this.retrieveValidatedCommits(),
    );

    if (bumperResult) {
      const changelogWriter = await ChangelogWriter.withDefaultPreset(remoteRepositoryInformation);
      changelogWriter.writeChangelog(
        path,
        bumperResult.version,
        bumperResult.releaseType,
        this.retrieveValidatedCommits(),
      );
    }
  }

  private static retrieveValidatedCommits(): ValidatedCommits<string, DefaultAllowedTypes> {
    return CommitsValidator.withDefaultScopesAndTypes().getValidatedCommits(
      new CommitsParser().getParsedCommits(
        new CommitsRetriever().getRawCommits(),
      ),
    );
  }
}
