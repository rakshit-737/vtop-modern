import { describe, expect, it, vi } from 'vitest';

import { LifecycleCoordinator } from '../../src/core/dom/lifecycle';

describe('lifecycle coordinator', () => {
  it('uses one observer and coalesces a mutation burst', async () => {
    const coordinator = new LifecycleCoordinator(document.documentElement);
    const parse = vi.fn();
    coordinator.subscribe('parse', parse);
    coordinator.start();
    expect(coordinator.getDiagnostics().observerCount).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const firstCount = parse.mock.calls.length;
    const node = document.createElement('div');
    document.body.append(node);
    document.body.append(document.createElement('span'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(parse.mock.calls.length).toBe(firstCount + 1);
    coordinator.stop();
    expect(coordinator.getDiagnostics().observerCount).toBe(0);
  });
});
