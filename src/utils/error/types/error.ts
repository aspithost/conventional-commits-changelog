import type {
  ErrorHandler,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logError,
} from '../logError.js';

/** Options that let you customize how the library reports errors. */
export interface OnError {
  /**
   * Called when the library reports an error without throwing.
   *
   * @defaultValue {@link logError}
   *
   * @see {@link ErrorHandler}
   */
  onError?: ErrorHandler | null;
}
