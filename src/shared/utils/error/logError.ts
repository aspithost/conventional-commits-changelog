export type ErrorHandler = (message: string, error: unknown) => unknown;

export function logError(message: string, error: unknown): void {
  console.error(message, error);
}

logError satisfies ErrorHandler;
