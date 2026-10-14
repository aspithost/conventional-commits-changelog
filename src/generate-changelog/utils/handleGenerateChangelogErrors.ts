import type { ErrorHandler } from '../../utils/error/logError.js';

export function handleGenerateChangelogErrors(
  generateChangelogVersionedResults: PromiseSettledResult<void>[],
  onError: ErrorHandler,
) {
  for (const result of generateChangelogVersionedResults) {
    if (result.status === 'rejected') {
      onError('Changelog generation failed', { error: result.reason as unknown });
    }
  }
}
