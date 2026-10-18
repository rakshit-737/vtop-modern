import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandPalette } from '../../src/features/command-palette/feature';

beforeEach(() => {
  document.body.replaceChildren();
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

describe('command palette keyboard behavior', () => {
  it('opens with Ctrl+K, searches, navigates, and restores focus', () => {
    const action = vi.fn();
    document.body.innerHTML =
      '<button id="before">Before</button><a hidden href="#hidden">Attendance Details</a><a id="visible" href="#attendance">Attendance Details</a>';
    const visible = document.querySelector('#visible') as HTMLAnchorElement;
    const click = vi.fn();
    visible.addEventListener('click', click);
    const palette = new CommandPalette({ togglePrivacy: action, toggleTheme: action });
    palette.start();
    const before = document.querySelector('#before') as HTMLElement;
    before.focus();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    const input = document
      .querySelector('vtop-command-palette')
      ?.shadowRoot?.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = 'attendance';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect((document.querySelector('vtop-command-palette') as HTMLElement | null)?.hidden).toBe(
      true,
    );
    expect(document.activeElement).toBe(before);
    expect(click).toHaveBeenCalledOnce();
    palette.stop();
  });

  it('handles empty results and ignores shortcuts in editable controls', () => {
    const palette = new CommandPalette({ togglePrivacy: vi.fn(), toggleTheme: vi.fn() });
    palette.start();
    const search = document.createElement('input');
    document.body.append(search);
    search.focus();
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    expect(document.querySelector('vtop-command-palette')).toBeNull();
    palette.open();
    const input = document
      .querySelector('vtop-command-palette')
      ?.shadowRoot?.querySelector('input') as HTMLInputElement;
    input.value = 'not-a-command';
    input.dispatchEvent(new Event('input'));
    expect(
      document.querySelector('vtop-command-palette')?.shadowRoot?.querySelector('.empty')
        ?.textContent,
    ).toBe('No matching commands.');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect((document.querySelector('vtop-command-palette') as HTMLElement | null)?.hidden).toBe(
      false,
    );
    palette.stop();
  });
});
