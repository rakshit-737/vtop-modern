import { describe, expect, it } from 'vitest';

import { parseTimetableTable } from '../../src/features/timetable/parser';

describe('timetable parser', () => {
  it('extracts today in portal order and omits empty markers', () => {
    document.body.innerHTML = `<table><caption>Weekly THEORY timetable</caption><tbody>
      <tr><td>MON</td><td>BCSE101 - A1</td><td>-</td><td>NIL</td></tr>
      <tr><td>TUE</td><td>OTHER</td></tr></tbody></table>`;
    const result = parseTimetableTable(document.querySelector('table') as HTMLTableElement, 1);
    expect(result?.name).toBe('MONDAY');
    expect(result?.slots).toEqual([{ label: 'BCSE101 - A1', period: 1 }]);
  });

  it('does not fabricate a schedule when the day is absent', () => {
    document.body.innerHTML =
      '<table><caption>Weekly timetable</caption><tr><td>TUE</td><td>BCSE</td></tr></table>';
    expect(parseTimetableTable(document.querySelector('table') as HTMLTableElement, 1)).toBeNull();
  });
});
