import { describe, expect, it } from 'vitest';

import { parseAttendanceTable } from '../../src/features/attendance/parser';

describe('attendance table parser', () => {
  it('recognizes a table with td headers and ignores invalid rows', () => {
    document.body.innerHTML = `
      <table id="attendance"><tr><td>Course</td><td>Attended Hours</td><td>Conducted Hours</td></tr>
      <tr><td>MAT101</td><td>15</td><td>20</td></tr>
      <tr><td>LAB999</td><td>--</td><td>--</td></tr></table>`;
    const table = document.querySelector('table') as HTMLTableElement;
    const result = parseAttendanceTable(table);
    expect(result?.unit).toBe('hours');
    expect(result?.rows).toHaveLength(2);
    expect(result?.rows[0]?.metrics.formattedPercent).toBe('75.0%');
    expect(result?.rows[1]?.metrics.valid).toBe(false);
  });

  it('does not mistake an unrelated table for attendance data', () => {
    document.body.innerHTML =
      '<table><tr><th>Course</th><th>Credits</th></tr><tr><td>MAT101</td><td>4</td></tr></table>';
    expect(parseAttendanceTable(document.querySelector('table') as HTMLTableElement)).toBeNull();
  });

  it('parses comma-separated integer counts but rejects composite values', () => {
    document.body.innerHTML =
      '<table><thead><tr><th>Attended</th><th>Total Classes</th></tr></thead><tbody><tr><td>1,024</td><td>2,048</td></tr><tr><td>14 / 15</td><td>15</td></tr></tbody></table>';
    const result = parseAttendanceTable(document.querySelector('table') as HTMLTableElement);
    expect(result?.rows[0]?.attended).toBe(1024);
    expect(result?.rows[0]?.conducted).toBe(2048);
    expect(result?.rows[1]?.metrics.valid).toBe(false);
  });

  it('accepts accessible row headers in data rows', () => {
    document.body.innerHTML = `
      <table><thead><tr><th>Course</th><th>Attended</th><th>Conducted</th></tr></thead>
      <tbody><tr><th scope="row">MAT101</th><td>15</td><td>20</td></tr></tbody></table>`;
    const result = parseAttendanceTable(document.querySelector('table') as HTMLTableElement);
    expect(result?.rows).toHaveLength(1);
    expect(result?.rows[0]).toMatchObject({ attended: 15, conducted: 20 });
  });
});
