import { z } from 'zod';

export const packageSchema = z.object({
  name: z.string(),
}).transform((pkg) => ({
  scopeName: pkg.name.includes('/') ? pkg.name.split('/')[1] : pkg.name,
}));
export type PackageSchema = z.infer<typeof packageSchema>;
