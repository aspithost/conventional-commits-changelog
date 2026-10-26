import { z } from 'zod';

import {
  COMMIT_FORMAT as _COMMIT_FORMAT,
} from '../CommitsRetriever.js';

const validGitInputString = z.string().regex(/^(?!-).*/);
export const commitsRetrieverOptions = z.object({
  /**
   * The pretty-format string passed to `git log`.
   * @defaultValue {@link _COMMIT_FORMAT | COMMIT_FORMAT}
   */
  commitFormat: z.string().optional(),
  /**
   * The working directory in which to run Git commands.
   * @defaultValue {@link process.cwd}
   */
  cwd: z.string().optional(),
  /**
   * The starting ref. When omitted, retrieval starts after the latest tag on the
   * default branch. Pass `null` to retrieve the full history up to `to`.
   */
  from: validGitInputString.nullable().optional(),
  /**
   * The ending ref for commit retrieval.
   * @defaultValue `'HEAD'`
   */
  to: validGitInputString.optional(),
});
export type CommitsRetrieverOptions = z.infer<typeof commitsRetrieverOptions>;
