import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function createPackageSchema<T extends string>() {
  return z.looseObject({
    name: z.string(),
  }).transform((pkg) => ({
    scopeName: pkg.name.includes('/')
      ? pkg.name.split('/')[1] as T
      : pkg.name as T,
  }));
}
export type PackageSchema<T extends string> = z.infer<ReturnType<typeof createPackageSchema<T>>>;
