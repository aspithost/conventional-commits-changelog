import type { ValidatedCommitSchema, ValidatedCommitSchemaWithScope } from '../schemas/commit.js';

type ValidatedCommitWithoutScope<T extends string> = ValidatedCommitSchema<T>;
export type ValidatedCommitsWithoutScope<T extends string> = Iterable<ValidatedCommitWithoutScope<T>>;

export type ValidatedCommitWithScope<T extends string, U extends string> = ValidatedCommitSchemaWithScope<T, U>;
export type ValidatedCommitsWithScope<T extends string, U extends string> = Iterable<ValidatedCommitWithScope<T, U>>;

export type ValidatedCommit<T extends string, U extends string> = ValidatedCommitWithoutScope<U> | ValidatedCommitWithScope<T, U>;
export type ValidatedCommits<T extends string, U extends string> = ValidatedCommitsWithoutScope<U> | ValidatedCommitsWithScope<T, U>;
