export interface DOMWatcherOptions {
  debounceMs: number;
  selector?: string;
  childList?: boolean;
  subtree?: boolean;
  attributes?: boolean;
}

export class DOMWatcher {
  private observer: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  constructor(
    private target: Node,
    private callback: (mutations: MutationRecord[]) => void,
    private options: DOMWatcherOptions = { debounceMs: 100 }
  ) {}

  start(): void {
    if (this.isRunning) return;
    
    this.observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations);
    });

    this.observer.observe(this.target, {
      childList: this.options.childList ?? true,
      subtree: this.options.subtree ?? true,
      attributes: this.options.attributes ?? false,
    });

    this.isRunning = true;
  }

  private handleMutations(mutations: MutationRecord[]): void {
    if (this.options.selector) {
      const relevantMutations = this.filterBySelector(mutations);
      if (relevantMutations.length === 0) return;
    }

    if (this.options.debounceMs > 0) {
      this.debounce(mutations);
    } else {
      this.callback(mutations);
    }
  }

  private filterBySelector(mutations: MutationRecord[]): MutationRecord[] {
    return mutations.filter(mutation => {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          if (node.matches?.(this.options.selector!) || 
              node.querySelector?.(this.options.selector!)) {
            return true;
          }
        }
      }
      return false;
    });
  }

  private debounce(mutations: MutationRecord[]): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.callback(mutations);
      this.debounceTimer = null;
    }, this.options.debounceMs);
  }

  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.observer?.disconnect();
    this.observer = null;
    this.isRunning = false;
  }
}
