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

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function createValidatedCommitSchema<T extends string>(
  types: readonly T[],
) {
  return z.looseObject({
    ...baseCommitSchema.shape,
    type: z.enum(types),
  });
}
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function createValidatedCommitSchemaWithScope<T extends string, U extends string>(
  scopes: readonly T[],
  types: readonly U[],
) {
  return z.looseObject({
    ...createValidatedCommitSchema(types).shape,
    scope: z.enum(scopes).nullable(),
  });
}

export type ValidatedCommitSchema<T extends string> = z.infer<
  ReturnType<typeof createValidatedCommitSchema<T>>
>;
export type ValidatedCommitSchemaWithScope<T extends string, U extends string> = z.infer<
  ReturnType<typeof createValidatedCommitSchemaWithScope<T, U>>
>;
