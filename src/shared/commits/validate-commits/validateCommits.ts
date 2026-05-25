import { DEFAULT_ALLOWED_TYPES } from '@/write-changelog/presets/constants/writer.js';
import type { DefaultAllowedTypes } from '@/write-changelog/presets/types/writer.js';

import { createValidatedCommitSchema, createValidatedCommitSchemaWithScope } from './schemas/commit.js';
import type { ParsedCommits } from '../parse-commits/CommitsParser.js';
import type { ValidatedCommits, ValidatedCommitsWithoutScope, ValidatedCommitsWithScope } from './types/commits.js';

export function validateCommits(parsedCommits: ParsedCommits): ValidatedCommitsWithoutScope<DefaultAllowedTypes>;
export function validateCommits<T extends string>(
  parsedCommits: ParsedCommits,
  options: {
    allowedTypes: readonly T[],
  },
): ValidatedCommitsWithoutScope<T>;
export function validateCommits<T extends string>(
  parsedCommits: ParsedCommits,
  options: {
    allowedScopes: readonly T[],
  },
): ValidatedCommitsWithScope<T, DefaultAllowedTypes>;
export function validateCommits<
  T extends string,
  U extends string
>(
  parsedCommits: ParsedCommits,
  options: {
    allowedScopes: readonly T[];
    allowedTypes: readonly U[];
  },
): ValidatedCommitsWithScope<T, U>;
export function *validateCommits<
  T extends string,
  U extends DefaultAllowedTypes = DefaultAllowedTypes
>(
  parsedCommits: ParsedCommits,
  {
    allowedScopes,
    allowedTypes,
  }: {
    allowedScopes?: readonly T[];
    allowedTypes?: readonly U[];
  } = {},
): ValidatedCommits<T, U> {
  let schema:
    | ReturnType<typeof createValidatedCommitSchema<U>>
    | ReturnType<typeof createValidatedCommitSchemaWithScope<T, U>>;

  const types = allowedTypes ?? DEFAULT_ALLOWED_TYPES;
  if (allowedScopes) {
    schema = createValidatedCommitSchemaWithScope(allowedScopes, types);
  } else {
    schema = createValidatedCommitSchema(types);
  }
  for (const parsedCommit of parsedCommits) {
    const validationResult = schema.safeParse(parsedCommit);
    if (!validationResult.success) {
      console.error('Validation error, did not yield commit', {
        commit: parsedCommit,
        error: validationResult.error,
      });
      continue;
    }
    yield validationResult.data;
  }
}
