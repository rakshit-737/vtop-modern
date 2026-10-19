import { describe, expect, it } from 'vitest';

import {
  enhanceLogin,
  focusLoginField,
  shouldFocusLoginField,
} from '../../src/features/auth/login';

describe('login assistance', () => {
  it('enhances login fields that arrive after the initial page load', () => {
    document.body.replaceChildren();
    const root = document.createElement('div');
    root.innerHTML =
      '<input name="uname"><input name="passwd" type="password"><input name="captchaCheck">';
    document.body.append(root);
    const event = { type: 'mutation' as const, roots: [root], records: [] };
    expect(shouldFocusLoginField(event)).toBe(true);
    enhanceLogin(event);
    const username = root.querySelector('input[name="uname"]') as HTMLInputElement;
    username.value = 'ab12';
    username.dispatchEvent(new Event('input', { bubbles: true }));
    expect(username.value).toBe('AB12');
    focusLoginField();
    expect(document.activeElement).toBe(root.querySelector('input[name="passwd"]'));
  });
});
