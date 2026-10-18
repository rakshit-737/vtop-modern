import { browser } from 'wxt/browser';

import { DEFAULT_SETTINGS, normalizeAttendanceSummary, normalizeSettings } from './normalize';
import type { AttendanceSummary, ExtensionSettings } from '../../types/domain';

const SUMMARY_KEY = 'vtop_attendance_summary';

function summaryKey(hostname: string): string {
  const safeHost = hostname.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
  return `${SUMMARY_KEY}:${safeHost}`;
}

export interface SettingsStore {
  get(): Promise<ExtensionSettings>;
  set(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings>;
  subscribe(listener: (settings: ExtensionSettings) => void): () => void;
}

export interface SummaryStore {
  get(hostname: string): Promise<AttendanceSummary | null>;
  set(summary: AttendanceSummary, hostname: string): Promise<void>;
  clear(hostname: string): Promise<void>;
}

export function createSettingsStore(): SettingsStore {
  const listeners = new Set<(settings: ExtensionSettings) => void>();

  const get = async (): Promise<ExtensionSettings> => {
    try {
      const value = await browser.storage.sync.get([...Object.keys(DEFAULT_SETTINGS), 'cgpaBlur']);
      const raw = value as Partial<ExtensionSettings> & { cgpaBlur?: unknown };
      const legacyPrivacy = typeof raw.cgpaBlur === 'boolean' ? raw.cgpaBlur : undefined;
      return normalizeSettings({
        ...DEFAULT_SETTINGS,
        ...raw,
        privacyShield: raw.privacyShield ?? legacyPrivacy,
      });
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  };

  const set = async (patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> => {
    const next = normalizeSettings({ ...(await get()), ...patch });
    try {
      await browser.storage.sync.set(next);
    } catch {
      // The UI remains usable when a browser profile temporarily rejects storage.
    }
    for (const listener of listeners) listener(next);
    return next;
  };

  const onChanged = (changes: Record<string, { newValue?: unknown }>, areaName: string): void => {
    if (areaName !== 'sync') return;
    const relevant = [...Object.keys(DEFAULT_SETTINGS), 'cgpaBlur'].some((key) => key in changes);
    if (!relevant) return;
    void get().then((settings) => {
      for (const listener of listeners) listener(settings);
    });
  };

  browser.storage.onChanged.addListener(onChanged);

  return {
    get,
    set,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function createSummaryStore(): SummaryStore {
  return {
    async get(hostname) {
      try {
        const key = summaryKey(hostname);
        const value = await browser.storage.local.get(key);
        return normalizeAttendanceSummary(value[key] as Partial<AttendanceSummary> | undefined);
      } catch {
        return null;
      }
    },
    async set(summary, hostname) {
      const normalized = normalizeAttendanceSummary(summary);
      if (!normalized) return;
      try {
        await browser.storage.local.set({ [summaryKey(hostname)]: normalized });
      } catch {
        // Local summary is an enhancement; portal behavior is not blocked by storage errors.
      }
    },
    async clear(hostname) {
      try {
        await browser.storage.local.remove(summaryKey(hostname));
      } catch {
        // Clearing stale summaries is best effort and never blocks the portal.
      }
    },
  };
}

export { SUMMARY_KEY };
