import type {
  AttendanceMetrics,
  AttendanceStatus,
  AttendanceSummary,
  AttendanceUnit,
} from '../../types/domain';

export const ATTENDANCE_THRESHOLD_NUMERATOR = 3;
export const ATTENDANCE_THRESHOLD_DENOMINATOR = 4;

const EMPTY_METRICS: AttendanceMetrics = {
  status: 'NO_DATA',
  valid: false,
  attended: 0,
  conducted: 0,
  percent: 0,
  formattedPercent: '0.0%',
  safeAbsences: 0,
  recoveryTarget: 0,
  unit: 'unknown',
};

function isValidUnit(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function formatPercent(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

function getStatus(percent: number, safeAbsences: number): AttendanceStatus {
  if (percent < 75) return 'CRITICAL';
  if (safeAbsences === 0) return 'ON_EDGE';
  if (percent < 80) return 'CAUTION';
  return 'SAFE';
}

/**
 * Calculates attendance using integer units. The caller supplies the unit
 * label detected by the portal adapter; no class/hour conversion is inferred.
 */
export function calculateAttendance(
  attended: number,
  conducted: number,
  unit: AttendanceUnit = 'unknown',
): AttendanceMetrics {
  if (
    !isValidUnit(attended) ||
    !isValidUnit(conducted) ||
    conducted === 0 ||
    attended > conducted
  ) {
    return { ...EMPTY_METRICS, unit };
  }

  const thresholdDelta = 4 * attended - 3 * conducted;
  const atOrAboveThreshold = thresholdDelta >= 0;
  const safeAbsences = atOrAboveThreshold ? Math.floor(thresholdDelta / 3) : 0;
  const recoveryTarget = atOrAboveThreshold ? 0 : 3 * conducted - 4 * attended;
  const percent = (attended / conducted) * 100;

  return {
    status: getStatus(percent, safeAbsences),
    valid: true,
    attended,
    conducted,
    percent,
    formattedPercent: formatPercent(percent),
    safeAbsences,
    recoveryTarget,
    unit,
  };
}

export function calculateAggregate(
  values: ReadonlyArray<Pick<AttendanceMetrics, 'attended' | 'conducted'>>,
  unit: AttendanceUnit = 'unknown',
): AttendanceMetrics {
  const totals = values.reduce(
    (result, value) => ({
      attended: result.attended + value.attended,
      conducted: result.conducted + value.conducted,
    }),
    { attended: 0, conducted: 0 },
  );

  return calculateAttendance(totals.attended, totals.conducted, unit);
}

export function calculateWhatIf(
  attended: number,
  conducted: number,
  additionalAbsences: number,
  additionalAttendances: number,
  unit: AttendanceUnit = 'unknown',
): AttendanceMetrics {
  if (
    !isValidUnit(additionalAbsences) ||
    !isValidUnit(additionalAttendances) ||
    additionalAbsences < 0 ||
    additionalAttendances < 0
  ) {
    return { ...EMPTY_METRICS, unit };
  }

  return calculateAttendance(
    attended + additionalAttendances,
    conducted + additionalAbsences + additionalAttendances,
    unit,
  );
}

export function buildAttendanceSummary(
  values: ReadonlyArray<AttendanceMetrics>,
  unit: AttendanceUnit,
  updatedAt = new Date().toISOString(),
): AttendanceSummary | null {
  const validValues = values.filter((value) => value.valid);
  if (validValues.length === 0) return null;

  const aggregate = calculateAggregate(validValues, unit);
  return {
    percent: aggregate.percent,
    formattedPercent: aggregate.formattedPercent,
    attended: aggregate.attended,
    conducted: aggregate.conducted,
    coursesBelow75: validValues.filter((value) => value.status === 'CRITICAL').length,
    totalCourses: validValues.length,
    safeAbsences: aggregate.safeAbsences,
    status: aggregate.status,
    unit,
    updatedAt,
  };
}
