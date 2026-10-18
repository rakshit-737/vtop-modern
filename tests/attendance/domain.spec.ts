import { describe, expect, it } from 'vitest';

import {
  buildAttendanceSummary,
  calculateAggregate,
  calculateAttendance,
  calculateWhatIf,
} from '../../src/features/attendance/domain';

describe('attendance domain', () => {
  it.each([
    [15, 15, '100.0%', 5, 0, 'SAFE'],
    [14, 15, '93.3%', 3, 0, 'SAFE'],
    [15, 20, '75.0%', 0, 0, 'ON_EDGE'],
    [18, 23, '78.3%', 1, 0, 'CAUTION'],
    [10, 15, '66.7%', 0, 5, 'CRITICAL'],
    [0, 2, '0.0%', 0, 6, 'CRITICAL'],
    [1, 1, '100.0%', 0, 0, 'ON_EDGE'],
  ] as const)(
    '%s/%s produces exact planning metrics',
    (attended, conducted, formatted, safe, recovery, status) => {
      const result = calculateAttendance(attended, conducted, 'classes');
      expect(result).toMatchObject({
        formattedPercent: formatted,
        safeAbsences: safe,
        recoveryTarget: recovery,
        status,
        valid: true,
        unit: 'classes',
      });
      expect(4 * (attended + result.recoveryTarget)).toBeGreaterThanOrEqual(
        3 * (conducted + result.recoveryTarget),
      );
    },
  );

  it.each([
    [-1, 10],
    [11, 10],
    [1.5, 2],
    [Number.NaN, 2],
    [1, 0],
  ])('rejects invalid integer units %s/%s', (attended, conducted) => {
    expect(calculateAttendance(attended, conducted).valid).toBe(false);
    expect(calculateAttendance(attended, conducted).status).toBe('NO_DATA');
  });

  it('uses weighted totals instead of averaging percentages', () => {
    const aggregate = calculateAggregate([
      calculateAttendance(10, 10),
      calculateAttendance(0, 100),
    ]);
    expect(aggregate.attended).toBe(10);
    expect(aggregate.conducted).toBe(110);
    expect(aggregate.formattedPercent).toBe('9.1%');
  });

  it('calculates what-if scenarios without changing the source values', () => {
    const result = calculateWhatIf(15, 20, 1, 0, 'hours');
    expect(result.formattedPercent).toBe('71.4%');
    expect(calculateAttendance(15, 20).formattedPercent).toBe('75.0%');
  });

  it('builds a summary only from valid rows', () => {
    const summary = buildAttendanceSummary(
      [
        calculateAttendance(15, 20, 'hours'),
        calculateAttendance(-1, -1, 'hours'),
        calculateAttendance(18, 23, 'hours'),
      ],
      'hours',
      '2026-10-18T10:00:00.000Z',
    );
    expect(summary).toMatchObject({
      attended: 33,
      conducted: 43,
      formattedPercent: '76.7%',
      totalCourses: 2,
      coursesBelow75: 0,
    });
  });
});
