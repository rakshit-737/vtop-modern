import type { LifecycleEvent } from '../../core/dom/lifecycle';

const USERNAME_SELECTORS = 'input[name="uname"], input#uname, input[name="username"]';
const PASSWORD_SELECTORS = 'input[name="passwd"], input#passwd, input[type="password"]';
const CAPTCHA_SELECTORS = 'input[name="captchaCheck"], input#captchaCheck, input[name="captcha"]';

export function enhanceLogin(event: LifecycleEvent): void {
  if (event.type === 'mutation' && event.roots.length === 0) return;
  const username = document.querySelector<HTMLInputElement>(USERNAME_SELECTORS);
  const password = document.querySelector<HTMLInputElement>(PASSWORD_SELECTORS);
  const captcha = document.querySelector<HTMLInputElement>(CAPTCHA_SELECTORS);
  if (!username) return;

  if (username.dataset.vtopModernLoginBound !== 'true') {
    username.dataset.vtopModernLoginBound = 'true';
    username.addEventListener('input', () => {
      const start = username.selectionStart;
      const end = username.selectionEnd;
      username.value = username.value.toUpperCase();
      if (start !== null && end !== null) username.setSelectionRange(start, end);
    });
  }
  if (password && captcha && password.dataset.vtopModernLoginBound !== 'true') {
    password.dataset.vtopModernLoginBound = 'true';
    password.addEventListener('keydown', (keyboardEvent) => {
      if (keyboardEvent.key === 'Enter' && password.value && !captcha.value) {
        keyboardEvent.preventDefault();
        captcha.focus();
      }
    });
  }
  const captchaImage = document.querySelector<HTMLImageElement>(
    '#imgCaptcha, img[src*="captcha" i]',
  );
  if (captchaImage) captchaImage.title = 'Click to reload captcha';
}

export function focusLoginField(): void {
  const username = document.querySelector<HTMLInputElement>(USERNAME_SELECTORS);
  const password = document.querySelector<HTMLInputElement>(PASSWORD_SELECTORS);
  const captcha = document.querySelector<HTMLInputElement>(CAPTCHA_SELECTORS);
  const target = !username?.value ? username : !password?.value ? password : captcha;
  target?.focus();
}

export function shouldFocusLoginField(event: LifecycleEvent): boolean {
  if (event.type === 'initial') return true;
  return event.roots.some((root) => {
    if (root instanceof HTMLInputElement) {
      return (
        root.matches(USERNAME_SELECTORS) ||
        root.matches(PASSWORD_SELECTORS) ||
        root.matches(CAPTCHA_SELECTORS)
      );
    }
    return root.querySelector<HTMLInputElement>(
      `${USERNAME_SELECTORS}, ${PASSWORD_SELECTORS}, ${CAPTCHA_SELECTORS}`,
    )
      ? true
      : false;
  });
}
