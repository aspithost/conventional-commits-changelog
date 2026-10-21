import type { ErrorHandler } from '../../../utils/error/logError.js';

export function logRejectedPromises(
  releasePackagesResults: PromiseSettledResult<void>[],
  onError: ErrorHandler,
  errorMessage: string,
) {
  for (const result of releasePackagesResults) {
    if (result.status === 'rejected') {
      onError(errorMessage, { error: result.reason as unknown });
    }
  }
}
