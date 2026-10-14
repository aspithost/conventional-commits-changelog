import type { ErrorHandler } from '../../utils/error/logError.js';

export function handleReleasePackagesErrors(
  releasePackagesResults: PromiseSettledResult<void>[],
  onError: ErrorHandler,
) {
  for (const result of releasePackagesResults) {
    if (result.status === 'rejected') {
      onError('A package release failed.', { error: result.reason as unknown });
    }
  }
}
