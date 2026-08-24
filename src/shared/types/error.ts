import type { ErrorHandler } from '@/shared/utils/error/logError.js';

export interface OnError {
  onError?: ErrorHandler;
}
