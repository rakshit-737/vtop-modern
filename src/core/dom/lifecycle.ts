export type LifecyclePhase = 'parse' | 'visual';

export interface LifecycleEvent {
  type: 'initial' | 'mutation';
  roots: readonly Element[];
  records: readonly MutationRecord[];
}

export interface LifecycleDiagnostics {
  observerCount: number;
  scanCount: number;
  scannedNodeCount: number;
  duplicateMountCount: number;
  storageSyncEvents: number;
  lastParseDurationMs: number;
}

type Listener = (event: LifecycleEvent) => void;

const OWNED_SELECTOR = '[data-vtop-modern-owned="true"]';

function asElement(node: Node): Element | null {
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
}

function isOwned(node: Node): boolean {
  const element = asElement(node);
  return Boolean(element?.matches(OWNED_SELECTOR) || element?.closest(OWNED_SELECTOR));
}

function frame(callback: () => void): number {
  return typeof window.requestAnimationFrame === 'function'
    ? window.requestAnimationFrame(() => callback())
    : window.setTimeout(callback, 0);
}

export class LifecycleCoordinator {
  private readonly parseListeners = new Set<Listener>();
  private readonly visualListeners = new Set<Listener>();
  private observer: MutationObserver | null = null;
  private parseQueued = false;
  private visualQueued = false;
  private pendingRecords: MutationRecord[] = [];
  private pendingRoots = new Set<Element>();
  private originalPushState: History['pushState'] | null = null;
  private originalReplaceState: History['replaceState'] | null = null;
  private readonly diagnostics: LifecycleDiagnostics = {
    observerCount: 0,
    scanCount: 0,
    scannedNodeCount: 0,
    duplicateMountCount: 0,
    storageSyncEvents: 0,
    lastParseDurationMs: 0,
  };

  constructor(private readonly root: Node = document.documentElement) {}

  start(): void {
    if (this.observer) return;
    this.installNavigationHooks();
    this.observer = new MutationObserver((records) => this.enqueue(records));
    this.observer.observe(this.root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id', 'class', 'aria-label', 'data-page'],
    });
    this.diagnostics.observerCount = 1;
    this.enqueue([]);
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.removeNavigationHooks();
    this.diagnostics.observerCount = 0;
    this.pendingRecords = [];
    this.pendingRoots.clear();
  }

  refresh(): void {
    this.enqueue([]);
  }

  subscribe(phase: LifecyclePhase, listener: Listener): () => void {
    const listeners = phase === 'parse' ? this.parseListeners : this.visualListeners;
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  markDuplicateMount(): void {
    this.diagnostics.duplicateMountCount += 1;
  }

  recordStorageSync(): void {
    this.diagnostics.storageSyncEvents += 1;
  }

  getDiagnostics(): LifecycleDiagnostics {
    return { ...this.diagnostics };
  }

  private enqueue(records: MutationRecord[]): void {
    const relevantRecords = records.filter((record) => !isOwned(record.target));
    for (const record of relevantRecords) {
      this.pendingRecords.push(record);
      const target = asElement(record.target);
      if (target && !isOwned(target)) this.pendingRoots.add(target);
      for (const node of record.addedNodes) {
        const element = asElement(node);
        if (element && !isOwned(element)) this.pendingRoots.add(element);
      }
    }

    if (records.length > 0 && relevantRecords.length === 0) return;
    if (!this.parseQueued) {
      this.parseQueued = true;
      queueMicrotask(() => {
        this.parseQueued = false;
        this.dispatch('parse');
      });
    }
    if (!this.visualQueued) {
      this.visualQueued = true;
      frame(() => {
        this.visualQueued = false;
        this.dispatch('visual');
      });
    }
  }

  private readonly handleNavigation = (): void => {
    this.enqueue([]);
  };

  private installNavigationHooks(): void {
    window.addEventListener('popstate', this.handleNavigation);
    window.addEventListener('hashchange', this.handleNavigation);
    this.originalPushState = window.history.pushState;
    this.originalReplaceState = window.history.replaceState;
    const pushState = this.originalPushState.bind(window.history);
    const replaceState = this.originalReplaceState.bind(window.history);
    window.history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => {
      const result = pushState(data, unused, url);
      this.handleNavigation();
      return result;
    }) as History['pushState'];
    window.history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
      const result = replaceState(data, unused, url);
      this.handleNavigation();
      return result;
    }) as History['replaceState'];
  }

  private removeNavigationHooks(): void {
    window.removeEventListener('popstate', this.handleNavigation);
    window.removeEventListener('hashchange', this.handleNavigation);
    if (this.originalPushState) window.history.pushState = this.originalPushState;
    if (this.originalReplaceState) window.history.replaceState = this.originalReplaceState;
    this.originalPushState = null;
    this.originalReplaceState = null;
  }

  private dispatch(phase: LifecyclePhase): void {
    const started = performance.now();
    const event: LifecycleEvent = {
      type: this.pendingRecords.length === 0 ? 'initial' : 'mutation',
      roots: [...this.pendingRoots],
      records: [...this.pendingRecords],
    };

    if (phase === 'parse') {
      this.diagnostics.scanCount += 1;
      this.diagnostics.scannedNodeCount += event.roots.length;
    }

    const listeners = phase === 'parse' ? this.parseListeners : this.visualListeners;
    for (const listener of listeners) listener(event);
    if (phase === 'parse') this.diagnostics.lastParseDurationMs = performance.now() - started;

    if (phase === 'visual') {
      this.pendingRecords = [];
      this.pendingRoots.clear();
    }
  }
}
