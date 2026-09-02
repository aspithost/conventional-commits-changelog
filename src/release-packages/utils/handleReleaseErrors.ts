import type { BaseReleaseOptions } from '@/release/types/release.js';

export function handleReleasePackagesErrors(
  releasePackagesResults: PromiseSettledResult<void>[],
  onError: NonNullable<BaseReleaseOptions['onError']>,
) {
  const failures = releasePackagesResults
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  for (const failure of failures) {
    onError('A package release failed.', { error: failure.reason as unknown });
  }
}
