import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFormattedDate } from './getFormattedDate.js';

describe('getFormattedDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the date in yyyy-mm-dd format for a standard date', () => {
    const date = new Date(2026, 0, 15);
    vi.setSystemTime(date);

    expect(getFormattedDate()).toBe('2026-01-15');
  });

  it('should handle single-digit months and days by padding with zeros', () => {
    const date = new Date(2026, 4, 5);
    vi.setSystemTime(date);

    expect(getFormattedDate()).toBe('2026-05-05');
  });

  it('should return the correct year transition', () => {
    const date = new Date(2025, 11, 31);
    vi.setSystemTime(date);

    expect(getFormattedDate()).toBe('2025-12-31');
  });
});
