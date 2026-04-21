import { bumpVersion } from '@/bumper/versionBumper.js';
import { CommitsParser } from '@/commits/parser/CommitsParser.js';
import { CommitsRetriever } from '@/commits/retriever/CommitsRetriever.js';
import { CommitsValidator, type DefaultAllowedTypes, type ValidatedCommits } from '@/commits/validator/CommitsValidator.js';
import { ChangelogWriter, type RemoteRepositoryInformation } from '@/writer/ChangelogWriter.js';

export async function release(remoteRepositoryInformation?: RemoteRepositoryInformation): Promise<void> {
  const path = process.cwd();
  const bumperResult = bumpVersion(path, retrieveValidatedCommits());

  if (bumperResult) {
    const changelogWriter = await ChangelogWriter.withDefaultPreset(remoteRepositoryInformation);
    try {
      await changelogWriter.writeChangelog(
        path,
        bumperResult.version,
        bumperResult.releaseType,
        retrieveValidatedCommits(),
      );
    } catch (err) {
      console.error(`Failed to write changelog for path ${path}:`, err);
    }
  }
}

function retrieveValidatedCommits(): ValidatedCommits<string, DefaultAllowedTypes> {
  return CommitsValidator.withDefaultScopesAndTypes().getValidatedCommits(
    new CommitsParser().getParsedCommits(
      new CommitsRetriever().getRawCommits(),
    ),
  );
}
