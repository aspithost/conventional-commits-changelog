export interface Context extends Record<string, unknown> {
  host?: string;
  owner?: string;
  repository?: string;
}
export interface Commit extends Record<string, unknown> {
  hash?: string;
}

export function formatCommitUrl(
  context: Context,
  commit: Commit,
): string | undefined {
  const { host, owner, repository } = context;
  if (host && owner && repository && commit.hash) {
    return `${host}/${owner}/${repository}/commit/${commit.hash}`;
  }
}
