import { z } from 'zod';

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

const baseCommitSchema = z.object({
  hash: z.string(),
  merge: z.string().nullable(),
  revert: commitMeta.nullable(),
  header: z.string().nullable(),
  body: z.string().nullable(),
  footer: z.string().nullable(),
  notes: z.array(commitNote),
  mentions: z.array(z.string()),
  references: z.array(commitReference),
});

export function createCommitSchema<T extends string, U extends string>(
  scopes: readonly T[],
  types: readonly U[],
) {
  return z.object({
    ...baseCommitSchema.shape,
    scope: z.enum(scopes),
    type: z.enum(types),
  }).catchall(z.string().nullable());
}
export type CommitSchema<T extends string, U extends string> = z.infer<ReturnType<typeof createCommitSchema<T, U>>>;
