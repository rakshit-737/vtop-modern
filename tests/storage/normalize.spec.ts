import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SETTINGS,
  normalizeAttendanceSummary,
  normalizeSettings,
} from '../../src/core/storage/normalize';

describe('storage normalization', () => {
  it('uses typed defaults and rejects truthy string booleans', () => {
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(
      normalizeSettings({ theme: 'invalid-theme' as never, privacyShield: 'false' as never }),
    ).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ theme: 'light' })).toMatchObject({ theme: 'light' });
  });

  it('accepts a complete summary and rejects malformed values', () => {
    const summary = normalizeAttendanceSummary({
      percent: 78.3,
      formattedPercent: '78.3%',
      attended: 18,
      conducted: 23,
      coursesBelow75: 0,
      totalCourses: 1,
      safeAbsences: 1,
      status: 'CAUTION',
      unit: 'hours',
      updatedAt: '2026-10-18T10:00:00.000Z',
    });
    expect(summary?.formattedPercent).toBe('78.3%');
    expect(normalizeAttendanceSummary({ ...summary, attended: 24 })).toBeNull();
    expect(normalizeAttendanceSummary(undefined)).toBeNull();
  });

  it('migrates the previous local summary shape without retaining raw page data', () => {
    const legacy = normalizeAttendanceSummary({
      percent: '78.3%',
      attended: 18,
      conducted: 23,
      coursesBelow75: 0,
      totalCourses: 1,
      bunks: 1,
      status: 'CAUTION',
      updatedAt: '2026-10-18T10:00:00.000Z',
    });
    expect(legacy).toMatchObject({ formattedPercent: '78.3%', safeAbsences: 1, unit: 'unknown' });
  });
});
