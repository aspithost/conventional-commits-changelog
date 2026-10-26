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
