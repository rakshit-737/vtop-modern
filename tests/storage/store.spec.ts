import { beforeEach, describe, expect, it, vi } from 'vitest';

const { emit, storageMock, syncValues } = vi.hoisted(() => {
  const syncValues: Record<string, unknown> = {};
  const localValues: Record<string, unknown> = {};
  const listeners = new Set<
    (changes: Record<string, { newValue?: unknown }>, areaName: string) => void
  >();
  const emit = (changes: Record<string, { newValue?: unknown }>, areaName: string): void => {
    for (const listener of listeners) listener(changes, areaName);
  };
  const storageMock = {
    sync: {
      get: vi.fn(async () => ({ ...syncValues })),
      set: vi.fn(async (values: Record<string, unknown>) => {
        Object.assign(syncValues, values);
        emit(
          Object.fromEntries(
            Object.entries(values).map(([key, value]) => [key, { newValue: value }]),
          ),
          'sync',
        );
      }),
    },
    local: {
      get: vi.fn(async (key: string) => ({ [key]: localValues[key] })),
      set: vi.fn(async (values: Record<string, unknown>) => {
        Object.assign(localValues, values);
        emit(
          Object.fromEntries(
            Object.entries(values).map(([key, value]) => [key, { newValue: value }]),
          ),
          'local',
        );
      }),
      remove: vi.fn(async (key: string) => {
        delete localValues[key];
        emit({ [key]: {} }, 'local');
      }),
    },
    onChanged: {
      addListener: (
        listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void,
      ) => listeners.add(listener),
      removeListener: (
        listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void,
      ) => listeners.delete(listener),
    },
  };
  return { emit, storageMock, syncValues };
});

vi.mock('wxt/browser', () => ({ browser: { storage: storageMock } }));

import { createSettingsStore } from '../../src/core/storage/store';

describe('settings storage', () => {
  beforeEach(() => {
    for (const key of Object.keys(syncValues)) delete syncValues[key];
    storageMock.sync.get.mockClear();
    storageMock.sync.set.mockClear();
  });

  it('serializes concurrent patches so neither update is lost', async () => {
    let releaseFirst: (() => void) | undefined;
    let blockFirst = true;
    storageMock.sync.set.mockImplementation(async (values: Record<string, unknown>) => {
      if (blockFirst) {
        blockFirst = false;
        await new Promise<void>((resolve) => {
          releaseFirst = resolve;
        });
      }
      Object.assign(syncValues, values);
    });

    const store = createSettingsStore();
    const first = store.set({ privacyShield: false });
    const second = store.set({ autoFocus: false });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(storageMock.sync.set).toHaveBeenCalledOnce();
    releaseFirst?.();
    await Promise.all([first, second]);
    expect(syncValues).toMatchObject({ privacyShield: false, autoFocus: false });
  });

  it('does not notify twice when a sync write also emits a storage event', async () => {
    storageMock.sync.set.mockImplementation(async (values: Record<string, unknown>) => {
      Object.assign(syncValues, values);
      emit(
        Object.fromEntries(
          Object.entries(values).map(([key, value]) => [key, { newValue: value }]),
        ),
        'sync',
      );
    });

    const store = createSettingsStore();
    const listener = vi.fn();
    store.subscribe(listener);
    await store.set({ privacyShield: false });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ privacyShield: false }));
  });
});
