import type { ErrorHandler } from '@/utils/error/logError.js';

export interface OnError {
  onError?: ErrorHandler;
}
