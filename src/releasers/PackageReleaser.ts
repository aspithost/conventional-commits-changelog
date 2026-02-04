import { VersionBumper } from '@/bumper/versionBumper.js';
import { CommitsParser } from '@/commits/parser/CommitsParser.js';
import { CommitsRetriever } from '@/commits/retriever/CommitsRetriever.js';
import {
  CommitsValidator,
  type DefaultAllowedTypes,
  type ValidatedCommit,
} from '@/commits/validator/CommitsValidator.js';
import { ScopesReader } from '@/scopes/ScopesReader.js';
import { ChangelogWriter, type RemoteRepositoryInformation } from '@/writer/ChangelogWriter.js';

interface ScopeContext<T extends string, U extends string> {
  scopePath: string;
  commits: ValidatedCommit<T, U>[];
}

export class PackageReleaser<T extends string, U extends string> {
  private readonly scopes: Map<T, ScopeContext<T, U>>;

  private constructor(scopes: Map<T, ScopeContext<T, U>>) {
    this.scopes = scopes;
  }

  static async init(): Promise<PackageReleaser<string, DefaultAllowedTypes>> {
    const scopesReader = new ScopesReader();
    const scopes = new Map<string, ScopeContext<string, DefaultAllowedTypes>>();

    scopes.set('root', {
      scopePath: process.cwd(),
      commits: [],
    });

    for (const { scopeName, scopePath } of scopesReader.scopeEntries) {
      scopes.set(scopeName, {
        scopePath,
        commits: [],
      });
    }

    const validatedCommits = CommitsValidator.withDefaultScopesAndTypes().getValidatedCommits(
      new CommitsParser().getParsedCommits(
        new CommitsRetriever().getRawCommits(),
      ),
    );

    for (const commit of validatedCommits) {
      const scopeName = commit.scope ?? 'root';
      scopes.get(scopeName)?.commits.push(commit);
    }

    return new PackageReleaser<string, DefaultAllowedTypes>(scopes);
  }

  async releasePackages(remoteRepositoryInformation?: RemoteRepositoryInformation): Promise<void> {
    for (const { scopePath, commits } of this.scopes.values()) {
      if (commits.length === 0) continue;

      const bumperResult = VersionBumper.bumpVersion(scopePath, commits);
      if (bumperResult) {
        const changelogWriter = await ChangelogWriter.withDefaultPreset(remoteRepositoryInformation);
        changelogWriter.writeChangelog(
          scopePath,
          bumperResult.version,
          bumperResult.releaseType,
          commits,
        );
      }
    }
  }
}
