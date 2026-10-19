import { createSummaryStore } from '../../core/storage/store';
import { buildAttendanceSummary } from './domain';
import { findAttendanceTables, parseAttendanceTable } from './parser';
import { createQuotaElement, createSummaryElement } from './ui';
import type { LifecycleEvent } from '../../core/dom/lifecycle';
import type { AttendanceMetrics, ParsedAttendanceTable } from '../../types/domain';

const QUOTA_CELL = 'vtop-modern-quota-cell';
const SUMMARY_MOUNT = 'vtop-modern-attendance-summary';
const summaryStore = createSummaryStore();
let tableId = 0;
let lastStoredSummaryKey = '';
let lastStoredSummaryHost = '';

function getTableId(table: HTMLTableElement): string {
  return (table.dataset.vtopModernAttendanceId ??= `attendance-${++tableId}`);
}

function summaryKey(summary: ReturnType<typeof buildAttendanceSummary>): string {
  return summary
    ? [
        summary.percent,
        summary.attended,
        summary.conducted,
        summary.coursesBelow75,
        summary.safeAbsences,
        summary.unit,
      ].join(':')
    : '';
}

function removeAttendanceSummary(table: HTMLTableElement): void {
  const sourceId = table.dataset.vtopModernAttendanceId;
  const parent = table.parentElement;
  if (!sourceId || !parent) return;
  [...parent.children]
    .filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child.classList.contains(SUMMARY_MOUNT) &&
        child.dataset.vtopModernAttendanceFor === sourceId,
    )
    .forEach((summary) => summary.remove());
}

function removeOrphanAttendanceSummaries(): void {
  const sourceIds = new Set(
    [...document.querySelectorAll<HTMLTableElement>('table[data-vtop-modern-attendance-id]')].map(
      (table) => table.dataset.vtopModernAttendanceId,
    ),
  );
  document.querySelectorAll<HTMLElement>(`.${SUMMARY_MOUNT}`).forEach((summary) => {
    if (!sourceIds.has(summary.dataset.vtopModernAttendanceFor)) summary.remove();
  });
}

function isVisible(table: HTMLTableElement): boolean {
  for (let current: HTMLElement | null = table; current; current = current.parentElement) {
    if (current.hidden || current.getAttribute('aria-hidden') === 'true') return false;
    const style = window.getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}

function addQuota(tableData: ParsedAttendanceTable): ReturnType<typeof buildAttendanceSummary> {
  const { table, headerRow, rows } = tableData;
  const sourceId = getTableId(table);
  let header = headerRow.querySelector<HTMLTableCellElement>(`[data-vtop-modern-column="quota"]`);
  if (!header) {
    header = document.createElement('th');
    header.dataset.vtopModernColumn = 'quota';
    header.textContent = '75% planning';
    header.scope = 'col';
    headerRow.append(header);
  }

  for (const item of rows) {
    const existing = item.row.querySelector<HTMLElement>(`.${QUOTA_CELL}`);
    const cell = existing ?? document.createElement('td');
    cell.className = QUOTA_CELL;
    cell.dataset.vtopModernOwned = 'true';
    cell.replaceChildren();
    if (item.metrics.valid && item.attended !== null && item.conducted !== null) {
      cell.append(createQuotaElement(item.metrics, item.attended, item.conducted));
    } else {
      const noData = document.createElement('span');
      noData.textContent = 'No data';
      noData.style.color = 'GrayText';
      cell.append(noData);
    }
    if (!existing) item.row.append(cell);
  }

  const metrics = rows
    .map((item) => item.metrics)
    .filter((metric): metric is AttendanceMetrics => metric.valid);
  const summary = buildAttendanceSummary(metrics, tableData.unit);
  if (!summary) {
    removeAttendanceSummary(table);
    return null;
  }
  const parent = table.parentElement;
  if (!parent) return summary;
  const previous = [...parent.children].find(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      child.classList.contains(SUMMARY_MOUNT) &&
      child.dataset.vtopModernAttendanceFor === sourceId,
  );
  const key = summaryKey(summary);
  if (previous?.dataset.summaryKey !== key) {
    const next = createSummaryElement(summary);
    next.dataset.summaryKey = key;
    next.dataset.vtopModernAttendanceFor = sourceId;
    if (previous) previous.replaceWith(next);
    else parent.insertBefore(next, table);
  }
  return summary;
}

function removeAttendanceEnhancement(table: HTMLTableElement): void {
  table.querySelectorAll(`.${QUOTA_CELL}`).forEach((cell) => cell.remove());
  table.querySelectorAll('[data-vtop-modern-column="quota"]').forEach((header) => header.remove());
  const sourceId = table.dataset.vtopModernAttendanceId;
  const parent = table.parentElement;
  if (!sourceId || !parent) return;
  [...parent.children]
    .filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child.classList.contains(SUMMARY_MOUNT) &&
        child.dataset.vtopModernAttendanceFor === sourceId,
    )
    .forEach((summary) => summary.remove());
}

export function clearAttendanceEnhancements(root: ParentNode = document): void {
  const tables = findAttendanceTables(root);
  for (const table of tables) removeAttendanceEnhancement(table);
  if (root === document) {
    document
      .querySelectorAll<HTMLElement>(`.${SUMMARY_MOUNT}`)
      .forEach((summary) => summary.remove());
  }
}

export function enhanceAttendance(event: LifecycleEvent): void {
  const roots = event.type === 'initial' ? [document] : event.roots;
  const affectedTables = new Set<HTMLTableElement>();
  for (const root of roots) {
    for (const table of findAttendanceTables(root)) affectedTables.add(table);
    if (root instanceof Element) {
      const table = root.closest('table');
      if (table instanceof HTMLTableElement) affectedTables.add(table);
    }
  }
  const tables = new Set([...findAttendanceTables(document), ...affectedTables]);
  const parsedTables: Array<{ table: HTMLTableElement; summary: ReturnType<typeof addQuota> }> = [];
  for (const table of tables) {
    const parsed = parseAttendanceTable(table);
    if (parsed) parsedTables.push({ table, summary: addQuota(parsed) });
    else removeAttendanceEnhancement(table);
  }

  const validTables = parsedTables.filter(
    (
      item,
    ): item is { table: HTMLTableElement; summary: NonNullable<ReturnType<typeof addQuota>> } =>
      item.summary !== null,
  );
  const active = validTables.find(({ table }) => isVisible(table)) ?? validTables[0];
  const hostname = window.location.hostname;
  if (active) {
    const key = summaryKey(active.summary);
    if (lastStoredSummaryHost !== hostname || lastStoredSummaryKey !== key) {
      lastStoredSummaryHost = hostname;
      lastStoredSummaryKey = key;
      void summaryStore.set(active.summary, hostname);
    }
  } else if (parsedTables.length > 0) {
    if (lastStoredSummaryHost === hostname) lastStoredSummaryKey = '';
    void summaryStore.clear(hostname);
  }
  removeOrphanAttendanceSummaries();
}
