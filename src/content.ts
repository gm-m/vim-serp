class VimyNavigation {
  private pendingKey: string = '';
  private pendingTimeout: number | null = null;
  private currentIndex: number = -1;
  private results: HTMLElement[] = [];

  private static readonly SEARCH_RESULTS_SELECTOR = [
    '#rso > div:has(> *) [data-hveid][data-ved] > [data-snc]',
    '#rso > :nth-child(1):has(> :nth-child(2)) [data-hveid][data-ved] > div:not([data-snc])',
    '#rso > div:nth-child(2) [data-hveid][data-ved] > div:not([data-snc])',
  ].join(', ');

  private static readonly CANDIDATE_RESULTS_SELECTOR = '#fprs > .Pqkn2e, #oFNiHe > :not(:has(#fprs)) > p';

  private static readonly SELECTORS = `${VimyNavigation.SEARCH_RESULTS_SELECTOR}, ${VimyNavigation.CANDIDATE_RESULTS_SELECTOR}`;

  private static readonly HIGHLIGHT_STYLE = `
    .vimy-highlight {
      background-color: rgba(66, 133, 244, 0.1);
      border-left: 3px solid #4285f4;
      padding-left: 8px;
      margin-left: -11px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }
  `;

  constructor() {
    this.injectStyles();
    this.setupKeyboardListener();
    this.setupMutationObserver();
    this.refreshResults();
    console.log('[Vimy] Extension loaded on Google Search');
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = VimyNavigation.HIGHLIGHT_STYLE;
    document.head.appendChild(style);
  }

  private setupKeyboardListener(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.isInputFocused()) return;

      const handled = this.handleKeyPress(e.key);
      if (handled) {
        e.preventDefault();
      }
    });
  }

  private setupMutationObserver(): void {
    const observer = new MutationObserver(() => {
      this.refreshResults();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  private refreshResults(): void {
    const elements = document.querySelectorAll<HTMLElement>(VimyNavigation.SELECTORS);
    this.results = Array.from(elements).filter(el => {
      const link = el.querySelector('a');
      const hasHeight = el.getBoundingClientRect().height > 0;
      return link && hasHeight;
    });
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      (activeElement as HTMLElement).isContentEditable
    );
  }

  private handleKeyPress(key: string): boolean {
    if (this.pendingTimeout) {
      window.clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    if (this.pendingKey === 'g') {
      if (key === 'g') {
        this.goToFirst();
        this.pendingKey = '';
        return true;
      }
      this.pendingKey = '';
    }

    switch (key) {
      case 'j':
        this.moveNext();
        return true;
      case 'k':
        this.movePrevious();
        return true;
      case 'G':
        this.goToLast();
        return true;
      case 'g':
        this.pendingKey = 'g';
        this.pendingTimeout = window.setTimeout(() => {
          this.pendingKey = '';
        }, 500);
        return false;
      case 'Enter':
        this.openCurrentResult();
        return true;
      case 'o':
        this.openCurrentResult();
        return true;
      case 'O':
        this.openCurrentResultInNewTab();
        return true;
      case 'H':
        this.goToPrevPage();
        return true;
      case 'L':
        this.goToNextPage();
        return true;
      default:
        return false;
    }
  }

  private moveNext(): void {
    if (this.results.length === 0) return;
    this.currentIndex = Math.min(this.currentIndex + 1, this.results.length - 1);
    this.highlightCurrent();
  }

  private movePrevious(): void {
    if (this.results.length === 0) return;
    this.currentIndex = Math.max(this.currentIndex - 1, 0);
    this.highlightCurrent();
  }

  private goToFirst(): void {
    if (this.results.length === 0) return;
    this.currentIndex = 0;
    this.highlightCurrent();
  }

  private goToLast(): void {
    if (this.results.length === 0) return;
    this.currentIndex = this.results.length - 1;
    this.highlightCurrent();
  }

  private highlightCurrent(): void {
    document.querySelectorAll('.vimy-highlight').forEach(el => {
      el.classList.remove('vimy-highlight');
    });

    const current = this.results[this.currentIndex];
    if (!current) return;

    current.classList.add('vimy-highlight');
    current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private getCurrentLink(): HTMLAnchorElement | null {
    const current = this.results[this.currentIndex];
    if (!current) return null;

    if (current.tagName === 'A') {
      return current as HTMLAnchorElement;
    }
    return current.querySelector('a[href]');
  }

  private openCurrentResult(): void {
    const link = this.getCurrentLink();
    if (link) {
      window.location.href = link.href;
    }
  }

  private openCurrentResultInNewTab(): void {
    const link = this.getCurrentLink();
    if (link) {
      window.open(link.href, '_blank');
    }
  }

  private goToNextPage(): void {
    const nextLink = document.querySelector<HTMLAnchorElement>('#pnnext');
    if (nextLink?.href) {
      window.location.href = nextLink.href;
    }
  }

  private goToPrevPage(): void {
    const prevLink = document.querySelector<HTMLAnchorElement>('#pnprev');
    if (prevLink?.href) {
      window.location.href = prevLink.href;
    }
  }
}

new VimyNavigation();
