import { z } from 'zod';

import { DEFAULT_ALLOWED_TYPES } from '@/commits/constants/commit.js';

const commitMeta = z.record(z.string(), z.string());

const commitNote = z.object({
  title: z.string(),
  text: z.string(),
});

const commitReference = z.object({
  raw: z.string(),
  action: z.string().nullable(),
  owner: z.string().nullable(),
  repository: z.string().nullable(),
  issue: z.string(),
  prefix: z.string(),
});

// Note: only exported for unit testing purposes
export const commitSchema = z.looseObject({
  hash: z.string(),
  body: z.string().nullable(),
  footer: z.string().nullable(),
  header: z.string().nullable(),
  mentions: z.array(z.string()),
  merge: z.string().nullable(),
  notes: z.array(commitNote),
  references: z.array(commitReference),
  revert: commitMeta.nullable(),
  scope: z.string().nullable(),
  subject: z.string().nullable(),
  type: z.string().nullable(),
});
export type CommitSchema = z.infer<typeof commitSchema>;

export function createCommitSchemaWithScope<T extends string>(
  allowedScopes: readonly T[],
) {
  return createCommitSchemaWithType(DEFAULT_ALLOWED_TYPES).extend({
    scope: z.enum(allowedScopes),
  });
}

export function createCommitSchemaWithType<T extends string>(
  allowedTypes: readonly T[],
) {
  return commitSchema.extend({
    type: z.enum(allowedTypes),
  });
}

export function createCommitSchemaWithScopeAndType<
  T extends string,
  U extends string
>(
  allowedScopes: readonly T[],
  allowedTypes: readonly U[],
) {
  return commitSchema.extend({
    scope: z.enum(allowedScopes),
    type: z.enum(allowedTypes),
  });
}
