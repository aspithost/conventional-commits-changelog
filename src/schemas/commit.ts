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
  body: z.string().nullable(),
  footer: z.string().nullable(),
  header: z.string().nullable(),
  mentions: z.array(z.string()),
  merge: z.string().nullable(),
  notes: z.array(commitNote),
  references: z.array(commitReference),
  revert: commitMeta.nullable(),
  subject: z.string().optional(),
});

export function createCommitSchema<
  T extends readonly string[],
  U extends readonly string[]
>(scopes: T, types: U) {
  return z.object({
    ...baseCommitSchema.shape,
    scope: z.enum(scopes).nullable().optional(),
    type: z.enum(types),
  });
}
export type CommitSchema<T extends readonly string[], U extends readonly string[]> = z.infer<ReturnType<typeof createCommitSchema<T, U>>>;
