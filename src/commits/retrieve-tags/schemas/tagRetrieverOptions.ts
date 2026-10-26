import { z } from 'zod';

import { DEFAULT_REMOTE_SYMBOLIC_REF as _DEFAULT_REMOTE_SYMBOLIC_REF } from '../TagRetriever.js';

const validGitInputString = z.string().regex(/^(?!-).*/);
export const tagRetrieverOptions = z.object({
  /**
   * The working directory in which to run Git commands.
   * @defaultValue {@link process.cwd}
   */
  cwd: z.string().optional(),
  /**
   * The ref used to determine the default remote branch.
   * @defaultValue {@link _DEFAULT_REMOTE_SYMBOLIC_REF | DEFAULT_REMOTE_SYMBOLIC_REF}
   */
  remoteSymbolicRef: validGitInputString.optional(),
});
export type TagRetrieverOptions = z.infer<typeof tagRetrieverOptions>;
