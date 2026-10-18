import { calculateAttendance } from './domain';
import type { AttendanceRow, AttendanceUnit, ParsedAttendanceTable } from '../../types/domain';

const ATTENDED_LABELS = /^(attended|present|attended hours?|attended classes?)$/i;
const CONDUCTED_LABELS = /^(conducted|total|conducted hours?|total hours?|total classes?)$/i;

function textOf(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function parseCount(element: Element | null | undefined): number | null {
  const value = textOf(element).replace(/,/g, '').trim();
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function unitForHeaders(attended: string, conducted: string): AttendanceUnit {
  const header = `${attended} ${conducted}`.toLowerCase();
  if (header.includes('hour')) return 'hours';
  if (header.includes('class')) return 'classes';
  return 'unknown';
}

function findHeaderRow(table: HTMLTableElement): HTMLTableRowElement | null {
  const explicit = table.querySelector('thead tr');
  if (explicit) return explicit as HTMLTableRowElement;
  const first = table.querySelector('tr');
  return first as HTMLTableRowElement | null;
}

export function parseAttendanceTable(table: HTMLTableElement): ParsedAttendanceTable | null {
  const headerRow = findHeaderRow(table);
  if (!headerRow) return null;
  const headerCells = [...headerRow.children].filter(
    (cell): cell is HTMLTableCellElement => cell instanceof HTMLTableCellElement,
  );
  let attendedIndex = -1;
  let conductedIndex = -1;
  let attendedLabel = '';
  let conductedLabel = '';

  headerCells.forEach((cell, index) => {
    const label = textOf(cell).replace(/\s+/g, ' ').trim();
    if (ATTENDED_LABELS.test(label) && !label.includes('%')) {
      attendedIndex = index;
      attendedLabel = label;
    }
    if (CONDUCTED_LABELS.test(label) && !label.includes('%')) {
      conductedIndex = index;
      conductedLabel = label;
    }
  });

  if (attendedIndex < 0 || conductedIndex < 0 || attendedIndex === conductedIndex) {
    return null;
  }

  const unit = unitForHeaders(attendedLabel, conductedLabel);
  const rows: AttendanceRow[] = [];
  const allRows = [...table.querySelectorAll('tbody tr, tr')].filter(
    (row): row is HTMLTableRowElement => row instanceof HTMLTableRowElement,
  );

  allRows.forEach((row, index) => {
    if (row === headerRow || row.closest('thead') || row.querySelector('th')) return;
    if (row.closest('table') !== table) return;
    const cells = [...row.children].filter(
      (cell): cell is HTMLTableCellElement => cell instanceof HTMLTableCellElement,
    );
    const attended = parseCount(cells[attendedIndex]);
    const conducted = parseCount(cells[conductedIndex]);
    const metrics =
      attended !== null && conducted !== null
        ? calculateAttendance(attended, conducted, unit)
        : calculateAttendance(-1, -1, unit);
    rows.push({
      row,
      attended,
      conducted,
      metrics,
      key: row.dataset.vtopModernRowKey || `row-${index}`,
    });
  });

  return { table, headerRow, attendedIndex, conductedIndex, unit, rows };
}

export function findAttendanceTables(root: ParentNode = document): HTMLTableElement[] {
  const candidates =
    root instanceof HTMLTableElement ? [root] : [...root.querySelectorAll('table')];
  return candidates.filter((table): table is HTMLTableElement => table instanceof HTMLTableElement);
}
