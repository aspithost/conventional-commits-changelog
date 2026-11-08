import { z } from 'zod';

export const bumpVersionOptions = z.object({
  /**
   * Whether to update the version references in the README after the bump.
   *
   * @defaultValue `false`
   */
  isUpdateReadme: z.boolean().optional(),
});
