import { z } from 'zod';

export const packageJsonSchema = z.object({
  name: z.string(),
});
export type PackageJsonSchema = z.infer<typeof packageJsonSchema>;
