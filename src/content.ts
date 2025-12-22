class VimyNavigation {
  private pendingKey: string = '';
  private pendingTimeout: number | null = null;

  constructor() {
    this.setupKeyboardListener();
    console.log('[Vimy] Extension loaded on Google Search');
  }

  private setupKeyboardListener(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.isInputFocused()) return;

      this.handleKeyPress(e.key);
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

  private handleKeyPress(key: string): void {
    if (this.pendingTimeout) {
      window.clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    if (this.pendingKey === 'g') {
      if (key === 'g') {
        console.log('[Vimy] Command: gg - Go to first result');
        this.pendingKey = '';
        return;
      }
      this.pendingKey = '';
    }

    switch (key) {
      case 'j':
        console.log('[Vimy] Command: j - Move to next result');
        break;
      case 'k':
        console.log('[Vimy] Command: k - Move to previous result');
        break;
      case 'G':
        console.log('[Vimy] Command: G - Go to last result');
        break;
      case 'g':
        this.pendingKey = 'g';
        this.pendingTimeout = window.setTimeout(() => {
          this.pendingKey = '';
        }, 500);
        break;
    }
  }
}

new VimyNavigation();
