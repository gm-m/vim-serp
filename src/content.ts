type SiteConfig = {
  selectors: string;
  nextPageSelector: string;
  prevPageSelector: string;
};

const SITE_CONFIGS: Record<string, SiteConfig> = {
  google: {
    selectors: [
      '#rso > div:has(> *) [data-hveid][data-ved] > [data-snc]',
      '#rso > :nth-child(1):has(> :nth-child(2)) [data-hveid][data-ved] > div:not([data-snc])',
      '#rso > div:nth-child(2) [data-hveid][data-ved] > div:not([data-snc])',
      '#fprs > .Pqkn2e',
      '#oFNiHe > :not(:has(#fprs)) > p',
    ].join(', '),
    nextPageSelector: '#pnnext',
    prevPageSelector: '#pnprev',
  },
  youtube: {
    selectors: 'ytd-video-renderer, ytd-channel-renderer, ytd-playlist-renderer',
    nextPageSelector: '',
    prevPageSelector: '',
  },
};

function detectSite(): SiteConfig | null {
  const hostname = window.location.hostname;
  if (hostname.includes('google.')) return SITE_CONFIGS.google;
  if (hostname.includes('youtube.com')) return SITE_CONFIGS.youtube;
  return null;
}

class VimyNavigation {
  private pendingKey: string = '';
  private pendingTimeout: number | null = null;
  private pendingCount: number | null = null;
  private currentIndex: number = -1;
  private results: HTMLElement[] = [];
  private siteConfig: SiteConfig;
  private countBuffer: string = '';
  private countTimeout: number | null = null;

  private static readonly HIGHLIGHT_STYLE = `
    .vimy-highlight {
      background-color: rgba(66, 133, 244, 0.1);
      border-left: 3px solid #4285f4;
      padding-left: 8px;
      margin-left: -11px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }
    .vimy-toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    .vimy-toast.visible {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    #vimy-help-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10001;
      display: none;
    }
    #vimy-help-overlay .vimy-help-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #272822;
      color: #f8f8f2;
      padding: 20px;
      border-radius: 8px;
      max-width: 80%;
      max-height: 80%;
      overflow: auto;
      font-family: monospace;
      font-size: 14px;
    }
    #vimy-help-overlay h2 { margin-top: 0; color: #66d9ef; }
    #vimy-help-overlay dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px; }
    #vimy-help-overlay dt { justify-self: end; }
    #vimy-help-overlay kbd {
      display: inline-block;
      padding: 2px 6px;
      background: rgba(63, 63, 63, 0.8);
      border: 1px solid #ccc;
      border-radius: 4px;
    }
  `;

  constructor(siteConfig: SiteConfig) {
    this.siteConfig = siteConfig;
    this.injectStyles();
    this.setupKeyboardListener();
    this.setupMutationObserver();
    this.refreshResults();
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
    const elements = document.querySelectorAll<HTMLElement>(this.siteConfig.selectors);
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
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(key)) {
      return false;
    }

    if (this.pendingTimeout) {
      window.clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    if (/^[0-9]$/.test(key)) {
      this.countBuffer += key;
      if (this.countTimeout) window.clearTimeout(this.countTimeout);
      this.countTimeout = window.setTimeout(() => {
        this.countBuffer = '';
      }, 1000);
      return true;
    }

    const hasCount = this.countBuffer !== '';
    const count = hasCount ? parseInt(this.countBuffer, 10) : 1;
    this.countBuffer = '';
    if (this.countTimeout) {
      window.clearTimeout(this.countTimeout);
      this.countTimeout = null;
    }

    if (this.pendingKey === 'g') {
      if (key === 'g') {
        this.goToFirst(this.pendingCount ?? undefined);
        this.pendingKey = '';
        this.pendingCount = null;
        return true;
      }
      this.pendingKey = '';
      this.pendingCount = null;
    }

    switch (key) {
      case 'j':
        this.moveNext(count);
        return true;
      case 'k':
        this.movePrevious(count);
        return true;
      case 'G':
        this.goToLast(hasCount ? count : undefined);
        return true;
      case 'g':
        this.pendingKey = 'g';
        this.pendingCount = hasCount ? count : null;
        this.pendingTimeout = window.setTimeout(() => {
          this.pendingKey = '';
          this.pendingCount = null;
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
      case 'y':
        this.copyFocusedUrl();
        return true;
      case '?':
        this.toggleHelp();
        return true;
      case 'Escape':
        this.closeHelp();
        return false;
      default:
        return false;
    }
  }

  private moveNext(count: number = 1): void {
    if (this.results.length === 0) return;
    this.currentIndex = Math.min(this.currentIndex + count, this.results.length - 1);
    this.highlightCurrent();
  }

  private movePrevious(count: number = 1): void {
    if (this.results.length === 0) return;
    this.currentIndex = Math.max(this.currentIndex - count, 0);
    this.highlightCurrent();
  }

  private goToFirst(count?: number): void {
    if (this.results.length === 0) return;
    if (count !== undefined) {
      this.currentIndex = Math.max(0, Math.min(count - 1, this.results.length - 1));
    } else {
      this.currentIndex = 0;
    }
    this.highlightCurrent();
  }

  private goToLast(count?: number): void {
    if (this.results.length === 0) return;
    if (count !== undefined) {
      this.currentIndex = Math.max(0, Math.min(count - 1, this.results.length - 1));
    } else {
      this.currentIndex = this.results.length - 1;
    }
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
    if (!this.siteConfig.nextPageSelector) return;
    const nextLink = document.querySelector<HTMLAnchorElement>(this.siteConfig.nextPageSelector);
    if (nextLink?.href) {
      window.location.href = nextLink.href;
    }
  }

  private goToPrevPage(): void {
    if (!this.siteConfig.prevPageSelector) return;
    const prevLink = document.querySelector<HTMLAnchorElement>(this.siteConfig.prevPageSelector);
    if (prevLink?.href) {
      window.location.href = prevLink.href;
    }
  }

  private copyFocusedUrl(): void {
    const link = this.getCurrentLink();
    if (link?.href) {
      navigator.clipboard.writeText(link.href).then(() => {
        this.showToast('URL copied to clipboard');
      });
    }
  }

  private showToast(message: string): void {
    const toast = document.createElement('div');
    toast.className = 'vimy-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  private toggleHelp(): void {
    let overlay = document.getElementById('vimy-help-overlay');
    if (!overlay) {
      overlay = this.createHelpOverlay();
    }
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
  }

  private closeHelp(): void {
    const overlay = document.getElementById('vimy-help-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  private createHelpOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'vimy-help-overlay';
    overlay.innerHTML = `
      <div class="vimy-help-content">
        <h2>VimSERP Help</h2>
        <dl>
          <dt><kbd>j</kbd> / <kbd>5j</kbd></dt><dd>Next result (with count)</dd>
          <dt><kbd>k</kbd> / <kbd>5k</kbd></dt><dd>Previous result (with count)</dd>
          <dt><kbd>gg</kbd> / <kbd>5gg</kbd></dt><dd>Jump to result (absolute)</dd>
          <dt><kbd>G</kbd> / <kbd>5G</kbd></dt><dd>Jump to result (absolute)</dd>
          <dt><kbd>Enter</kbd> / <kbd>o</kbd></dt><dd>Open result</dd>
          <dt><kbd>O</kbd></dt><dd>Open in new tab</dd>
          <dt><kbd>y</kbd></dt><dd>Copy URL</dd>
          <dt><kbd>H</kbd></dt><dd>Previous page (Google)</dd>
          <dt><kbd>L</kbd></dt><dd>Next page (Google)</dd>
          <dt><kbd>?</kbd></dt><dd>Toggle help</dd>
          <dt><kbd>Esc</kbd></dt><dd>Close help</dd>
        </dl>
      </div>
    `;
    overlay.addEventListener('click', () => this.closeHelp());
    document.body.appendChild(overlay);
    return overlay;
  }
}

const siteConfig = detectSite();
if (siteConfig) {
  new VimyNavigation(siteConfig);
}
