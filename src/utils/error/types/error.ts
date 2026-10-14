import type { ErrorHandler } from '../logError.js';

export interface OnError {
  /**
   * Called when the library reports an error without throwing.
   * You can opt out of error handling by setting onError to null.
   * @see {@link ErrorHandler}
   */
  onError?: ErrorHandler | null;
}
