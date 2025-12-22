# VimSERP

Vim-style keyboard navigation for Google and YouTube search results

## Features

- **Vim-style navigation** - Use familiar keys to move through search results
- **Visual highlighting** - Current selection is clearly highlighted
- **Smooth scrolling** - Selected results scroll into view automatically
- **Page navigation** - Jump between search result pages
- **Cross-browser** - Works on Chrome, Edge, Firefox, and other browsers

## Keybindings

| Key | Action |
|-----|--------|
| `j` | Move to next result |
| `k` | Move to previous result |
| `gg` | Jump to first result |
| `G` | Jump to last result |
| `Enter` / `o` | Open selected result |
| `O` | Open selected result in new tab |
| `H` | Go to previous page |
| `L` | Go to next page |

## How It Works

The extension injects a content script on Google search pages that:
1. Detects search result elements using robust CSS selectors
2. Listens for keyboard events (ignoring input fields)
3. Highlights the current selection with a visual indicator
4. Scrolls the selected result into view

## Installation

### Chrome / Edge (Chromium-based browsers)

1. Clone the repository
2. Run `npm install && npm run build`
3. Open `chrome://extensions` (or `edge://extensions`)
4. Enable "Developer mode"
5. Click "Load unpacked" and select the `./dist` folder

### Firefox

1. Clone the repository
2. Run `npm install && npm run buildFirefox`
3. Open `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on" and select any file in the `./dist` folder

## Development

```bash
npm install        # Install dependencies
npm run build      # Build for Chrome
npm run buildFirefox  # Build for Firefox
npm run dev        # Development mode with hot reload
```
