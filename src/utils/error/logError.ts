/**
 * Handles an error that the library reports without throwing.
 *
 * @param message - Human-readable description of the problem.
 * @param error - The underlying error or value.
 */
export type ErrorHandler = (message: string, error: unknown) => unknown;

/**
 * Logs the message and associated error with `console.error`.
 *
 * Use this function as the default {@link ErrorHandler}.
 */
export function logError(message: string, error: unknown): void {
  console.error(message, error);
}

logError satisfies ErrorHandler;
