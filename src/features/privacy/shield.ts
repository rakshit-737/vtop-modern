import { addStyles, createShadowMount } from '../../core/dom/shadow';

const SHIELDED = 'vtop-privacy-shielded';
const academicTextPattern = /^(?:CGPA|GPA|Grade Point)\s*[:=]?\s*\d+(?:\.\d+)?/i;
const academicLabelPattern = /CGPA|GPA|GRADE POINT/i;
const sensitiveHeaderPattern = /marks?|scored|grade|gpa|cgpa|cat|fat/i;

interface ShieldBinding {
  toggle: (event: Event) => void;
  keydown: (event: KeyboardEvent) => void;
  role: string | null;
  tabIndex: string | null;
  ariaLabel: string | null;
}

const bindings = new WeakMap<HTMLElement, ShieldBinding>();

function textOf(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function setShieldState(element: HTMLElement, enabled: boolean): void {
  element.classList.toggle(SHIELDED, enabled);
  element.classList.toggle('revealed', !enabled);
  element.setAttribute(
    'aria-label',
    enabled
      ? 'Academic value hidden. Activate to reveal.'
      : 'Academic value visible. Activate to hide.',
  );
}

function bindShield(element: HTMLElement, enabled: boolean): void {
  const isNew = !bindings.has(element);
  if (isNew) {
    const toggle = (event: Event): void => {
      event.stopPropagation();
      const nextEnabled = !element.classList.contains(SHIELDED);
      setShieldState(element, nextEnabled);
    };
    const keydown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle(event);
    };
    bindings.set(element, {
      toggle,
      keydown,
      role: element.getAttribute('role'),
      tabIndex: element.getAttribute('tabindex'),
      ariaLabel: element.getAttribute('aria-label'),
    });
    element.dataset.vtopModernPrivacyBound = 'true';
    element.tabIndex = 0;
    element.setAttribute('role', 'button');
    element.addEventListener('click', toggle);
    element.addEventListener('keydown', keydown);
  }
  if (isNew) setShieldState(element, enabled);
}

function unbindShield(element: HTMLElement): void {
  const binding = bindings.get(element);
  if (!binding) return;
  element.removeEventListener('click', binding.toggle);
  element.removeEventListener('keydown', binding.keydown);
  bindings.delete(element);
  element.classList.remove(SHIELDED, 'revealed');
  if (binding.role === null) element.removeAttribute('role');
  else element.setAttribute('role', binding.role);
  if (binding.tabIndex === null) element.removeAttribute('tabindex');
  else element.setAttribute('tabindex', binding.tabIndex);
  if (binding.ariaLabel === null) element.removeAttribute('aria-label');
  else element.setAttribute('aria-label', binding.ariaLabel);
}

function shieldTable(table: HTMLTableElement, enabled: boolean): void {
  const headerRows = [...table.querySelectorAll('thead tr')];
  const headerRow = headerRows[0] ?? table.querySelector('tr');
  if (!headerRow) return;
  const sensitiveIndexes = [...headerRow.children].reduce<number[]>((indexes, cell, index) => {
    if (sensitiveHeaderPattern.test(textOf(cell))) indexes.push(index);
    return indexes;
  }, []);
  if (sensitiveIndexes.length === 0) return;
  for (const row of table.querySelectorAll('tbody tr')) {
    const cells = [...row.children];
    for (const index of sensitiveIndexes) {
      const cell = cells[index];
      if (cell instanceof HTMLElement) bindShield(cell, enabled);
    }
  }
}

export function shieldAcademicValues(root: ParentNode, enabled: boolean): void {
  if (!enabled) {
    updatePrivacyShield(root, false);
    return;
  }
  const candidates =
    root instanceof HTMLElement
      ? [root, ...root.querySelectorAll('td, span, div, strong, b, h4, h5')]
      : [...root.querySelectorAll('td, span, div, strong, b, h4, h5')];
  for (const candidate of candidates) {
    if (!(candidate instanceof HTMLElement) || candidate.dataset.vtopModernOwned === 'true')
      continue;
    const text = textOf(candidate);
    if (text.length > 80 || candidate.children.length > 2) continue;
    const previousText = textOf(candidate.previousElementSibling);
    const isLeaf = candidate.children.length === 0;
    const hasValue = /(?:\d+(?:\.\d+)?|\b[A-F][+-]?\b)/i.test(text);
    const isLabel = academicLabelPattern.test(previousText) && !/\d/.test(previousText);
    if (isLeaf && (academicTextPattern.test(text) || (hasValue && isLabel))) {
      bindShield(candidate, enabled);
    }
  }

  const tables = root instanceof HTMLTableElement ? [root] : [...root.querySelectorAll('table')];
  for (const table of tables) {
    if (table instanceof HTMLTableElement) shieldTable(table, enabled);
  }
}

export function updatePrivacyShield(root: ParentNode, enabled: boolean): void {
  const elements: HTMLElement[] = [];
  if (root instanceof HTMLElement && root.dataset.vtopModernPrivacyBound === 'true') {
    elements.push(root);
  }
  elements.push(...root.querySelectorAll<HTMLElement>('[data-vtop-modern-privacy-bound="true"]'));
  elements.forEach((element) => {
    if (enabled) {
      bindShield(element, true);
      setShieldState(element, true);
    } else unbindShield(element);
  });
}

const STYLE = `
:host { display: inline; }
`;

export function createPrivacyDock(
  enabled: boolean,
  onToggle: (enabled: boolean) => void,
  onPalette: () => void,
  onTheme: () => void,
): HTMLElement {
  const mount = createShadowMount<HTMLElement>('vtop-privacy-dock', 'vtop-modern-dock');
  const shadow = mount.shadowRoot as ShadowRoot;
  addStyles(shadow, STYLE);
  const host = document.createElement('div');
  mount.dataset.vtopModernPrivacyEnabled = String(enabled);
  host.setAttribute('role', 'toolbar');
  host.setAttribute('aria-label', 'VTOP Modern tools');
  host.style.cssText =
    'position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;gap:4px;padding:4px;border:1px solid color-mix(in srgb, CanvasText 18%, transparent);border-radius:999px;background:Canvas;box-shadow:0 8px 30px color-mix(in srgb, CanvasText 18%, transparent);font:13px system-ui,sans-serif;';
  const makeButton = (label: string, title: string, action: () => void): HTMLButtonElement => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', title);
    button.textContent = label;
    button.title = title;
    button.style.cssText =
      'border:0;background:transparent;color:CanvasText;border-radius:999px;padding:7px 9px;cursor:pointer;';
    button.addEventListener('click', action);
    return button;
  };
  host.append(
    makeButton('⌘K', 'Open command palette', onPalette),
    makeButton(enabled ? 'Hide' : 'Show', 'Toggle on-screen academic privacy shield', () => {
      const nextEnabled = mount.dataset.vtopModernPrivacyEnabled !== 'true';
      mount.dataset.vtopModernPrivacyEnabled = String(nextEnabled);
      onToggle(nextEnabled);
    }),
    makeButton('◐', 'Toggle theme', onTheme),
  );
  shadow.append(host);
  return mount;
}

export function updatePrivacyDock(mount: HTMLElement, enabled: boolean): void {
  mount.dataset.vtopModernPrivacyEnabled = String(enabled);
  const button = mount.shadowRoot?.querySelectorAll('button')[1];
  if (button) button.textContent = enabled ? 'Hide' : 'Show';
}
