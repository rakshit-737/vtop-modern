import { createShadowMount, addStyles, appendText } from '../../core/dom/shadow';
import type { LifecycleEvent } from '../../core/dom/lifecycle';
import { findTimetableTables, parseTimetableTable } from './parser';

let tableId = 0;

function getTableId(table: HTMLTableElement): string {
  return (table.dataset.vtopModernTimetableId ??= `timetable-${++tableId}`);
}

const STYLE = `
:host { display:block; margin:14px 0; }
section { padding:14px; border:1px solid color-mix(in srgb, CanvasText 18%, transparent); border-radius:10px; background:Canvas; color:CanvasText; font:13px/1.4 system-ui,sans-serif; box-shadow:0 4px 18px color-mix(in srgb, CanvasText 10%, transparent); }
 h2 { margin:0 0 8px; font:600 14px system-ui,sans-serif; }
 ul { display:grid; gap:6px; margin:0; padding:0; list-style:none; }
 li { padding:7px 9px; border:1px solid color-mix(in srgb, CanvasText 12%, transparent); border-radius:7px; }
 small { color:GrayText; }
`;

function createTimetableCard(
  dayName: string,
  slots: ReadonlyArray<{ label: string; period: number }>,
  sourceId: string,
): HTMLElement {
  const mount = createShadowMount<HTMLElement>('vtop-timetable-assistant', 'vtop-modern-timetable');
  mount.dataset.vtopModernTimetableFor = sourceId;
  mount.dataset.timetableKey = `${dayName}:${slots.map((slot) => `${slot.period}-${slot.label}`).join('|')}`;
  const shadow = mount.shadowRoot as ShadowRoot;
  addStyles(shadow, STYLE);
  const section = document.createElement('section');
  appendText(
    section,
    'h2',
    `Today's portal schedule · ${dayName[0]}${dayName.slice(1).toLowerCase()}`,
  );
  const list = document.createElement('ul');
  if (slots.length === 0) {
    appendText(list, 'li', 'No schedule entries were present for today.');
  } else {
    for (const slot of slots) {
      const item = document.createElement('li');
      appendText(item, 'small', `Period ${slot.period} · `);
      appendText(item, 'span', slot.label);
      list.append(item);
    }
  }
  section.append(list);
  shadow.append(section);
  return mount;
}

export function enhanceTimetable(event: LifecycleEvent): void {
  const roots = event.type === 'initial' ? [document] : event.roots;
  const tables = new Set<HTMLTableElement>();
  for (const root of roots) {
    for (const table of findTimetableTables(root)) tables.add(table);
    if (root instanceof Element) {
      const table = root.closest('table');
      if (table instanceof HTMLTableElement) tables.add(table);
    }
  }
  for (const table of tables) {
    const sourceId = getTableId(table);
    const day = parseTimetableTable(table);
    const parent = table.parentElement;
    if (!day || !parent) {
      removeTimetableEnhancement(table);
      continue;
    }
    table.querySelectorAll('.vtop-modern-today').forEach((row) => {
      if (row !== day.row) row.classList.remove('vtop-modern-today');
    });
    if (!day.row.classList.contains('vtop-modern-today'))
      day.row.classList.add('vtop-modern-today');
    const old = [...parent.children].find(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child.classList.contains('vtop-modern-timetable') &&
        child.dataset.vtopModernTimetableFor === sourceId,
    );
    const key = `${day.name}:${day.slots.map((slot) => `${slot.period}-${slot.label}`).join('|')}`;
    if (!old || old.dataset.timetableKey !== key) {
      const card = createTimetableCard(day.name, day.slots, sourceId);
      if (old) old.replaceWith(card);
      else parent.insertBefore(card, table);
    }
  }
}

function removeTimetableEnhancement(table: HTMLTableElement): void {
  table
    .querySelectorAll('.vtop-modern-today')
    .forEach((row) => row.classList.remove('vtop-modern-today'));
  const sourceId = table.dataset.vtopModernTimetableId;
  const parent = table.parentElement;
  if (!sourceId || !parent) return;
  [...parent.children]
    .filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement &&
        child.classList.contains('vtop-modern-timetable') &&
        child.dataset.vtopModernTimetableFor === sourceId,
    )
    .forEach((card) => card.remove());
}

export function clearTimetableEnhancements(root: ParentNode = document): void {
  const tables = findTimetableTables(root);
  for (const table of tables) removeTimetableEnhancement(table);
  if (root === document) {
    document
      .querySelectorAll<HTMLElement>('.vtop-modern-timetable')
      .forEach((card) => card.remove());
    document
      .querySelectorAll('.vtop-modern-today')
      .forEach((row) => row.classList.remove('vtop-modern-today'));
  }
}
