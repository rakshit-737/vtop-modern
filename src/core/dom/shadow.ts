export function createShadowMount<T extends HTMLElement>(tagName: string, className: string): T {
  const element = document.createElement(tagName) as T;
  element.className = className;
  element.dataset.vtopModernOwned = 'true';
  if (!element.shadowRoot) element.attachShadow({ mode: 'open' });
  return element;
}

export function appendText(
  parent: Node,
  tagName: string,
  text: string,
  className?: string,
): HTMLElement {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

export function addStyles(shadowRoot: ShadowRoot, css: string): void {
  const style = document.createElement('style');
  style.textContent = css;
  shadowRoot.appendChild(style);
}
