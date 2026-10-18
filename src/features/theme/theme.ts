import type { ThemePreference } from '../../types/domain';

function resolvedTheme(theme: ThemePreference): 'dark' | 'light' {
  if (theme !== 'system') return theme;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme: ThemePreference): void {
  const resolved = resolvedTheme(theme);
  document.documentElement.dataset.vtopTheme = resolved;
  document.documentElement.dataset.vtopThemePreference = theme;
  document.documentElement.style.colorScheme = resolved;
}

export function toggleTheme(current: ThemePreference): ThemePreference {
  return resolvedTheme(current) === 'dark' ? 'light' : 'dark';
}

export function installSystemThemeListener(getTheme: () => ThemePreference): () => void {
  const media = window.matchMedia?.('(prefers-color-scheme: light)');
  if (!media) return () => undefined;
  const listener = (): void => {
    if (getTheme() === 'system') applyTheme('system');
  };
  media.addEventListener?.('change', listener);
  return () => media.removeEventListener?.('change', listener);
}
