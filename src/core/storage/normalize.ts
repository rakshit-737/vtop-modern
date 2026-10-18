import type {
  AttendanceStatus,
  AttendanceSummary,
  AttendanceUnit,
  ExtensionSettings,
  NormalizedAttendanceSummary,
  ThemePreference,
} from '../../types/domain';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  theme: 'system',
  attendanceCalc: true,
  privacyShield: true,
  autoFocus: true,
  timetableHighlight: true,
};

const THEMES: ReadonlySet<ThemePreference> = new Set(['dark', 'light', 'system']);
const STATUSES: ReadonlySet<AttendanceStatus> = new Set([
  'NO_DATA',
  'CRITICAL',
  'ON_EDGE',
  'CAUTION',
  'SAFE',
]);
const UNITS: ReadonlySet<AttendanceUnit> = new Set(['hours', 'classes', 'weighted', 'unknown']);

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function themeOrDefault(value: unknown): ThemePreference {
  return typeof value === 'string' && THEMES.has(value as ThemePreference)
    ? (value as ThemePreference)
    : DEFAULT_SETTINGS.theme;
}

export function normalizeSettings(
  value: Partial<ExtensionSettings> | null | undefined,
): ExtensionSettings {
  return {
    theme: themeOrDefault(value?.theme),
    attendanceCalc: booleanOrDefault(value?.attendanceCalc, DEFAULT_SETTINGS.attendanceCalc),
    privacyShield: booleanOrDefault(value?.privacyShield, DEFAULT_SETTINGS.privacyShield),
    autoFocus: booleanOrDefault(value?.autoFocus, DEFAULT_SETTINGS.autoFocus),
    timetableHighlight: booleanOrDefault(
      value?.timetableHighlight,
      DEFAULT_SETTINGS.timetableHighlight,
    ),
  };
}

function finiteNonNegativeInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function validPercent(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : null;
}

type RawAttendanceSummary = Omit<
  Partial<AttendanceSummary>,
  'percent' | 'formattedPercent' | 'unit'
> & {
  percent?: unknown;
  formattedPercent?: unknown;
  unit?: unknown;
  bunks?: unknown;
};

export function normalizeAttendanceSummary(
  value: RawAttendanceSummary | null | undefined,
): NormalizedAttendanceSummary | null {
  if (!value) return null;

  const percentValue =
    typeof value.percent === 'string' ? Number.parseFloat(value.percent) : value.percent;
  const percent = validPercent(percentValue);
  const attended = finiteNonNegativeInteger(value.attended);
  const conducted = finiteNonNegativeInteger(value.conducted);
  const coursesBelow75 = finiteNonNegativeInteger(value.coursesBelow75);
  const totalCourses = finiteNonNegativeInteger(value.totalCourses);
  const safeAbsences = finiteNonNegativeInteger(value.safeAbsences ?? value.bunks);
  const formattedPercent =
    typeof value.formattedPercent === 'string'
      ? value.formattedPercent
      : percent === null
        ? null
        : `${percent.toFixed(1)}%`;
  const unit = value.unit ?? 'unknown';
  const updatedAt =
    typeof value.updatedAt === 'string' && !Number.isNaN(Date.parse(value.updatedAt))
      ? value.updatedAt
      : new Date(0).toISOString();

  if (
    percent === null ||
    attended === null ||
    conducted === null ||
    attended > conducted ||
    coursesBelow75 === null ||
    totalCourses === null ||
    safeAbsences === null ||
    formattedPercent === null ||
    !STATUSES.has(value.status as AttendanceStatus) ||
    !UNITS.has(unit as AttendanceUnit)
  ) {
    return null;
  }

  return {
    percent,
    formattedPercent,
    attended,
    conducted,
    coursesBelow75,
    totalCourses,
    safeAbsences,
    status: value.status as AttendanceStatus,
    unit: unit as AttendanceUnit,
    updatedAt,
  };
}
