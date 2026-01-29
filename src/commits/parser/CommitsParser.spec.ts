import type { RawCommit, RawCommits } from '@/commits/retriever/CommitsRetriever.js';
import { CommitsParser } from './CommitsParser.js';

function* createRawCommits(commits: RawCommit[]): RawCommits {
  for (const commit of commits) {
    yield commit;
  }
}

describe('CommitsParser', () => {
  it('should parse a single commit and include the hash', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'feat: add feature' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);
    const commit = parsedCommitsIterator.next().value;

    expect(commit).toMatchObject({
      type: 'feat',
      subject: 'add feature',
      hash: 'abc123',
    });
    
    expect(parsedCommitsIterator.next().done).toBe(true);
  });

  it('should parse multiple commits', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'feat: add feature' },
      { hash: 'def456', commit: 'fix: bug fix' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);

    const firstCommit = parsedCommitsIterator.next().value;
    const secondCommit = parsedCommitsIterator.next().value;

    expect(firstCommit).toMatchObject({ type: 'feat', subject: 'add feature', hash: 'abc123' });
    expect(secondCommit).toMatchObject({ type: 'fix', subject: 'bug fix', hash: 'def456' });
    expect(parsedCommitsIterator.next().done).toBe(true);
  });

  it('should handle commits with a scope', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'feat(parser): add feature' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);

    expect(parsedCommitsIterator.next().value).toMatchObject({
      type: 'feat',
      scope: 'parser',
      subject: 'add feature',
      hash: 'abc123',
    });
    expect(parsedCommitsIterator.next().done).toBe(true);
  });

  it('should handle commits with notes', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'feat: add feature\n\nBREAKING CHANGE: old API removed\nBREAKING CHANGE: config format changed' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);
    const parsedCommit = parsedCommitsIterator.next().value;

    expect(parsedCommit?.notes).toHaveLength(2);
    expect(parsedCommit?.notes[0]).toMatchObject({ title: 'BREAKING CHANGE', text: 'old API removed' });
    expect(parsedCommit?.notes[1]).toMatchObject({ title: 'BREAKING CHANGE', text: 'config format changed' });
  });

  it('should handle commits with mentions', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'feat: add feature\n\nThanks to @johndoe and @janedoe for the help' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);
    const parsedCommit = parsedCommitsIterator.next().value;

    expect(parsedCommit?.mentions).toContain('johndoe');
    expect(parsedCommit?.mentions).toContain('janedoe');
  });

  it('should handle commits with references', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'feat: add feature\n\nRefs #123, #456' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);
    const parsedCommit = parsedCommitsIterator.next().value;

    expect(parsedCommit?.references).toHaveLength(2);
    expect(parsedCommit?.references[0]).toMatchObject({ prefix: '#', issue: '123' });
    expect(parsedCommit?.references[1]).toMatchObject({ prefix: '#', issue: '456' });
  });

  it('should not return a commit when there are no commits', () => {
    const rawCommits = createRawCommits([]);

    expect(new CommitsParser().getParsedCommits(rawCommits).next().value).toBeUndefined();
  });

  it('should handle breaking changes with a "!" after the type and scope', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'feat(api)!: remove deprecated endpoint' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);
    const parsedCommit = parsedCommitsIterator.next().value;

    expect(parsedCommit).toMatchObject({
      type: 'feat',
      scope: 'api',
      subject: 'remove deprecated endpoint',
      hash: 'abc123',
    });
    expect(parsedCommit?.notes).toHaveLength(1);
    expect(parsedCommit?.notes[0]).toMatchObject({
      title: 'BREAKING CHANGE',
    });
  });

  it('should handle a BREAKING CHANGE text in the footer', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'refactor: change config format\n\nBREAKING CHANGE: config now uses YAML instead of JSON' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);
    const parsedCommit = parsedCommitsIterator.next().value;

    expect(parsedCommit?.notes).toHaveLength(1);
    expect(parsedCommit?.notes[0]).toMatchObject({
      title: 'BREAKING CHANGE',
      text: 'config now uses YAML instead of JSON',
    });
  });

  it('should handle issue references', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'fix: resolve memory leak\n\nCloses #123\nFixes gh-456' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);
    const parsedCommit = parsedCommitsIterator.next().value;

    expect(parsedCommit?.references).toHaveLength(2);
    expect(parsedCommit?.references[0]).toMatchObject({ action: 'Closes', prefix: '#', issue: '123' });
    expect(parsedCommit?.references[1]).toMatchObject({ action: 'Fixes', prefix: 'gh-', issue: '456' });
  });

  it('should handle revert commits', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'Revert "feat: add new feature"\n\nThis reverts commit def456.' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);

    expect(parsedCommitsIterator.next().value?.revert).toMatchObject({
      header: 'feat: add new feature',
      hash: 'def456',
    });
  });

  it('should handle a commit with a body', () => {
    const rawCommits = createRawCommits([
      { hash: 'abc123', commit: 'feat(auth): add OAuth support\n\nImplements OAuth 2.0 authentication flow.' },
    ]);

    const parsedCommitsIterator = new CommitsParser().getParsedCommits(rawCommits);

    expect(parsedCommitsIterator.next().value).toMatchObject({
      type: 'feat',
      scope: 'auth',
      subject: 'add OAuth support',
      body: 'Implements OAuth 2.0 authentication flow.',
      hash: 'abc123',
    });
  });
});
