export type ThemePreference = 'dark' | 'light' | 'system';

export type AttendanceStatus = 'NO_DATA' | 'CRITICAL' | 'ON_EDGE' | 'CAUTION' | 'SAFE';

export type AttendanceUnit = 'hours' | 'classes' | 'weighted' | 'unknown';

export interface ExtensionSettings {
  theme: ThemePreference;
  attendanceCalc: boolean;
  privacyShield: boolean;
  autoFocus: boolean;
  timetableHighlight: boolean;
}

export interface AttendanceMetrics {
  status: AttendanceStatus;
  valid: boolean;
  attended: number;
  conducted: number;
  percent: number;
  formattedPercent: string;
  safeAbsences: number;
  recoveryTarget: number;
  unit: AttendanceUnit;
}

export interface AttendanceRow {
  row: HTMLTableRowElement;
  attended: number | null;
  conducted: number | null;
  metrics: AttendanceMetrics;
  key: string;
}

export interface ParsedAttendanceTable {
  table: HTMLTableElement;
  headerRow: HTMLTableRowElement;
  attendedIndex: number;
  conductedIndex: number;
  unit: AttendanceUnit;
  rows: AttendanceRow[];
}

export interface AttendanceSummary {
  percent: number;
  formattedPercent: string;
  attended: number;
  conducted: number;
  coursesBelow75: number;
  totalCourses: number;
  safeAbsences: number;
  status: AttendanceStatus;
  unit: AttendanceUnit;
  updatedAt: string;
}

export interface TimetableSlot {
  label: string;
  period: number;
}

export interface TimetableDay {
  name: string;
  row: HTMLTableRowElement;
  slots: TimetableSlot[];
}

export type NormalizedAttendanceSummary = AttendanceSummary;
