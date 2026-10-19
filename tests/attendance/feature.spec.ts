import { beforeEach, describe, expect, it, vi } from 'vitest';

const browserMock = vi.hoisted(() => ({
  storage: {
    local: {
      get: vi.fn(async () => ({})),
      set: vi.fn<(values: Record<string, unknown>) => Promise<void>>(async () => undefined),
      remove: vi.fn(async () => undefined),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
}));

vi.mock('wxt/browser', () => ({ browser: browserMock }));

import { enhanceAttendance } from '../../src/features/attendance/feature';

function lifecycle(type: 'initial' | 'mutation' = 'initial'): {
  type: 'initial' | 'mutation';
  roots: readonly Element[];
  records: readonly MutationRecord[];
} {
  return { type, roots: type === 'initial' ? [] : [document.body], records: [] };
}

describe('attendance enhancement lifecycle', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    browserMock.storage.local.set.mockClear();
    browserMock.storage.local.remove.mockClear();
  });

  it('keeps no-data cells visible and removes stale summaries after replacement', () => {
    document.body.innerHTML = `
      <table><thead><tr><th>Course</th><th>Attended</th><th>Conducted</th></tr></thead>
      <tbody><tr><th scope="row">MAT101</th><td>15</td><td>20</td></tr></tbody></table>`;
    enhanceAttendance(lifecycle());
    expect(document.querySelectorAll('.vtop-modern-attendance-summary')).toHaveLength(1);

    const replacement = document.createElement('table');
    replacement.innerHTML =
      '<thead><tr><th>Course</th><th>Attended</th><th>Conducted</th></tr></thead><tbody><tr><th scope="row">MAT101</th><td>--</td><td>--</td></tr></tbody>';
    document.querySelector('table')?.replaceWith(replacement);
    enhanceAttendance({ type: 'mutation', roots: [replacement], records: [] });

    expect(document.querySelectorAll('.vtop-modern-attendance-summary')).toHaveLength(0);
    expect(document.querySelectorAll('.vtop-modern-quota-cell')).toHaveLength(1);
    expect(document.querySelector('.vtop-modern-quota-cell')?.textContent).toContain('No data');
    expect(browserMock.storage.local.remove).toHaveBeenCalled();
  });

  it('stores the visible table summary when several tables are present', () => {
    document.body.innerHTML = `
      <div hidden><table><tr><th>Course</th><th>Attended</th><th>Conducted</th></tr><tr><td>A</td><td>1</td><td>2</td></tr></table></div>
      <table><tr><th>Course</th><th>Attended</th><th>Conducted</th></tr><tr><td>B</td><td>9</td><td>10</td></tr></table>`;
    enhanceAttendance(lifecycle());
    const stored = browserMock.storage.local.set.mock.calls.at(-1)?.[0];
    const summary = stored ? Object.values(stored)[0] : undefined;
    expect(summary).toMatchObject({ attended: 9, conducted: 10 });
  });
});
