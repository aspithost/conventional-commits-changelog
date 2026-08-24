import type { DefaultAllowedTypes } from '@/shared/types/commit.js';
import type { CommitSchema } from '../schemas/commit.js';

export type ValidatedCommitWithDefaultType = CommitSchema & { type: DefaultAllowedTypes };

export type ValidatedCommitWithScope<
  T extends string
> = ValidatedCommitWithDefaultType & { scope: T };

export type ValidatedCommitWithType<
  T extends string
> = CommitSchema & { type: T };

export type ValidatedCommitWithScopeAndType<
  Scope extends string,
  Type extends string
> = CommitSchema & { scope: Scope; type: Type };

export type ValidatedCommit<
  Scope extends string,
  Type extends string
> =
  | ValidatedCommitWithDefaultType
  | ValidatedCommitWithScope<Scope>
  | ValidatedCommitWithType<Type>
  | ValidatedCommitWithScopeAndType<Scope, Type>;
