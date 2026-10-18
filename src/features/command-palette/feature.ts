import { addStyles, appendText, createShadowMount } from '../../core/dom/shadow';

interface PaletteCommand {
  category: string;
  title: string;
  description: string;
  keywords: string;
  run: () => boolean;
}

const STYLE = `
:host { all: initial; }
.overlay { position:fixed; inset:0; z-index:2147482000; display:flex; align-items:flex-start; justify-content:center; padding:12vh 16px 16px; background:rgb(0 0 0 / .58); font:14px/1.35 system-ui,sans-serif; color:CanvasText; }
.modal { width:min(620px,100%); max-height:min(560px,calc(100vh - 24px)); display:flex; flex-direction:column; overflow:hidden; border:1px solid color-mix(in srgb, CanvasText 22%, transparent); border-radius:12px; background:Canvas; box-shadow:0 20px 70px rgb(0 0 0 / .32); }
.search { display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid color-mix(in srgb, CanvasText 14%, transparent); }
input { min-width:0; flex:1; border:0; outline:0; background:transparent; color:CanvasText; font:inherit; font-size:16px; }
.results { min-height:80px; max-height:390px; overflow:auto; padding:8px; }
.group { margin:6px 10px 3px; color:GrayText; font-size:11px; font-weight:650; text-transform:uppercase; letter-spacing:.06em; }
.item { display:flex; align-items:center; gap:10px; width:100%; padding:10px; border:0; border-radius:7px; background:transparent; color:CanvasText; text-align:left; cursor:pointer; }
.item[aria-selected=true], .item:hover { background:color-mix(in srgb, CanvasText 10%, transparent); }
.info { min-width:0; flex:1; } .title, .description { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .title { font-weight:600; } .description { margin-top:2px; color:GrayText; font-size:12px; }
.empty { padding:36px 12px; color:GrayText; text-align:center; }
.footer { display:flex; justify-content:space-between; gap:8px; padding:9px 14px; border-top:1px solid color-mix(in srgb, CanvasText 14%, transparent); color:GrayText; font-size:12px; }
kbd { padding:2px 5px; border:1px solid color-mix(in srgb, CanvasText 18%, transparent); border-radius:4px; font:11px ui-monospace,monospace; }
@media (prefers-reduced-motion:reduce) { .overlay { animation:none; } }
`;

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

function normalizedText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function findNavigationTarget(terms: readonly string[]): HTMLElement | null {
  const candidates = [...document.querySelectorAll('a, button')];
  return candidates.find((candidate) => {
    if (candidate.hasAttribute('hidden') || candidate.getAttribute('aria-hidden') === 'true')
      return false;
    const style = window.getComputedStyle(candidate);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const text = normalizedText(candidate.textContent ?? '');
    return terms.some((term) => text === term || text.includes(term));
  }) as HTMLElement | null;
}

export interface CommandPaletteOptions {
  togglePrivacy: () => void;
  toggleTheme: () => void;
}

export class CommandPalette {
  private mount: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private results: HTMLElement | null = null;
  private activeIndex = 0;
  private filtered: PaletteCommand[] = [];
  private previousFocus: Element | null = null;
  private status: HTMLElement | null = null;

  constructor(private readonly options: CommandPaletteOptions) {}

  start(): void {
    if (this.mount) return;
    window.addEventListener('keydown', this.handleGlobalKeydown);
  }

  stop(): void {
    window.removeEventListener('keydown', this.handleGlobalKeydown);
    this.mount?.remove();
    this.mount = null;
  }

  open(): void {
    if (!this.mount) this.create();
    if (!this.mount || !this.input) return;
    this.previousFocus = document.activeElement;
    this.mount.hidden = false;
    const overlay = this.mount.shadowRoot?.querySelector<HTMLElement>('.overlay');
    if (overlay) overlay.hidden = false;
    this.input.value = '';
    this.filter('');
    this.input.focus();
  }

  close(): void {
    if (!this.mount) return;
    this.mount.hidden = true;
    const overlay = this.mount.shadowRoot?.querySelector<HTMLElement>('.overlay');
    if (overlay) overlay.hidden = true;
    if (this.previousFocus instanceof HTMLElement) this.previousFocus.focus();
  }

  private readonly handleGlobalKeydown = (event: KeyboardEvent): void => {
    if (isEditable(event.target)) return;
    if (
      event.repeat ||
      !(event.ctrlKey || event.metaKey) ||
      event.shiftKey ||
      event.altKey ||
      event.key.toLowerCase() !== 'k'
    )
      return;
    event.preventDefault();
    if (this.mount && !this.mount.hidden) this.close();
    else this.open();
  };

  private commands(): PaletteCommand[] {
    return [
      {
        category: 'Portal',
        title: 'Attendance details',
        description: 'Open a visible portal attendance link',
        keywords: 'attendance present classes hours',
        run: () => this.runNavigation(['attendance', 'attendence']),
      },
      {
        category: 'Portal',
        title: 'Class timetable',
        description: 'Open a visible portal timetable link',
        keywords: 'timetable schedule classes slots',
        run: () => this.runNavigation(['timetable', 'time table', 'schedule']),
      },
      {
        category: 'Portal',
        title: 'Marks and grades',
        description: 'Open a visible portal marks link',
        keywords: 'marks grades cat fat results gpa cgpa',
        run: () => this.runNavigation(['marks', 'grades', 'results']),
      },
      {
        category: 'VTOP Modern',
        title: 'Toggle privacy shield',
        description: 'Show or hide academic values on this page',
        keywords: 'privacy blur hide reveal shield',
        run: () => {
          this.options.togglePrivacy();
          return true;
        },
      },
      {
        category: 'VTOP Modern',
        title: 'Toggle theme',
        description: 'Switch between light and dark surfaces',
        keywords: 'theme dark light appearance',
        run: () => {
          this.options.toggleTheme();
          return true;
        },
      },
      {
        category: 'System',
        title: 'Refresh portal',
        description: 'Reload the current page',
        keywords: 'reload refresh',
        run: () => {
          window.location.reload();
          return true;
        },
      },
    ];
  }

  private runNavigation(terms: readonly string[]): boolean {
    const target = findNavigationTarget(terms);
    if (!target) {
      if (this.status)
        this.status.textContent = 'No matching portal destination is visible on this page.';
      return false;
    }
    target.click();
    return true;
  }

  private create(): void {
    this.mount = createShadowMount<HTMLElement>(
      'vtop-command-palette',
      'vtop-modern-command-palette',
    );
    const shadow = this.mount.shadowRoot as ShadowRoot;
    addStyles(shadow, STYLE);
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.hidden = true;
    const modal = document.createElement('section');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'VTOP Modern command palette');
    const search = document.createElement('div');
    search.className = 'search';
    appendText(search, 'span', '⌕', undefined);
    this.input = document.createElement('input');
    this.input.type = 'search';
    this.input.placeholder = 'Search visible portal pages and actions…';
    this.input.setAttribute('aria-label', 'Search commands');
    this.input.addEventListener('input', () => this.filter(this.input?.value ?? ''));
    this.input.addEventListener('keydown', this.handleInputKeydown);
    search.append(this.input);
    appendText(search, 'kbd', 'Esc');
    this.results = document.createElement('div');
    this.results.className = 'results';
    this.results.setAttribute('role', 'listbox');
    this.status = appendText(modal, 'div', '', 'empty');
    this.status.hidden = true;
    modal.insertBefore(search, this.status);
    modal.insertBefore(this.results, this.status);
    const footer = document.createElement('footer');
    footer.className = 'footer';
    appendText(footer, 'span', '↑↓ navigate · Enter select · Esc close');
    appendText(footer, 'span', 'VTOP Modern');
    modal.append(footer);
    overlay.append(modal);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) this.close();
    });
    shadow.append(overlay);
    document.body.append(this.mount);
  }

  private readonly handleInputKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.filtered.length === 0) return;
      this.activeIndex =
        event.key === 'ArrowDown'
          ? (this.activeIndex + 1) % this.filtered.length
          : (this.activeIndex - 1 + this.filtered.length) % this.filtered.length;
      this.render();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const command = this.filtered[this.activeIndex];
      if (!command) return;
      if (command.run()) this.close();
    }
  };

  private filter(query: string): void {
    const normalized = normalizedText(query);
    const commands = this.commands();
    this.filtered = normalized
      ? commands.filter((command) =>
          normalizedText(
            `${command.title} ${command.description} ${command.keywords} ${command.category}`,
          ).includes(normalized),
        )
      : commands;
    this.activeIndex = 0;
    this.render();
  }

  private render(): void {
    if (!this.results || !this.status) return;
    const results = this.results;
    results.replaceChildren();
    this.status.hidden = this.filtered.length > 0;
    if (this.filtered.length === 0) {
      this.status.textContent = 'No matching commands.';
      return;
    }
    this.status.textContent = '';
    let category = '';
    this.filtered.forEach((command, index) => {
      if (command.category !== category) {
        category = command.category;
        appendText(results, 'div', category, 'group');
      }
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'item';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(index === this.activeIndex));
      const info = document.createElement('span');
      info.className = 'info';
      appendText(info, 'span', command.title, 'title');
      appendText(info, 'span', command.description, 'description');
      item.append(appendText(item, 'span', '›'), info);
      item.addEventListener('click', () => {
        if (command.run()) this.close();
      });
      results.append(item);
      if (index === this.activeIndex) item.scrollIntoView({ block: 'nearest' });
    });
  }
}
