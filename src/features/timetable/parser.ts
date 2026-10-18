import type { TimetableDay, TimetableSlot } from '../../types/domain';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_ALIASES = new Map([
  ['SUN', 'SUNDAY'],
  ['MON', 'MONDAY'],
  ['TUE', 'TUESDAY'],
  ['WED', 'WEDNESDAY'],
  ['THU', 'THURSDAY'],
  ['FRI', 'FRIDAY'],
  ['SAT', 'SATURDAY'],
]);

function textOf(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

export function normalizeDay(value: string): string | null {
  const normalized = value.toUpperCase().trim();
  if (DAY_NAMES.includes(normalized)) return normalized;
  return DAY_ALIASES.get(normalized) ?? null;
}

export function parseTimetableTable(
  table: HTMLTableElement,
  today = new Date().getDay(),
): TimetableDay | null {
  const marker = textOf(table).toUpperCase();
  if (!marker.includes('THEORY') && !marker.includes('LAB') && !marker.includes('TIMETABLE'))
    return null;

  const rows = [...table.querySelectorAll('tbody tr, tr')].filter(
    (row): row is HTMLTableRowElement =>
      row instanceof HTMLTableRowElement && row.closest('table') === table,
  );
  const todayName = DAY_NAMES[today];
  if (!todayName) return null;

  for (const row of rows) {
    const firstCell = row.firstElementChild;
    const day = normalizeDay(textOf(firstCell));
    if (day !== todayName) continue;
    const slots: TimetableSlot[] = [];
    [...row.children].slice(1).forEach((cell, index) => {
      const label = textOf(cell);
      if (!label || /^(-|nil|n\/a)$/i.test(label)) return;
      slots.push({ label, period: index + 1 });
    });
    return { name: day, row, slots };
  }

  return null;
}

export function findTimetableTables(root: ParentNode = document): HTMLTableElement[] {
  const candidates =
    root instanceof HTMLTableElement ? [root] : [...root.querySelectorAll('table')];
  return candidates.filter((table): table is HTMLTableElement => table instanceof HTMLTableElement);
}
