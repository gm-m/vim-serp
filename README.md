# VimSERP

Vim-style keyboard navigation for Google and YouTube search results

## Features

- **Vim-style navigation** - Use familiar keys to move through search results
- **Visual highlighting** - Current selection is clearly highlighted
- **Smooth scrolling** - Selected results scroll into view automatically
- **Page navigation** - Jump between search result pages (Google)
- **Cross-browser** - Works on Chrome, Edge, Firefox, and other browsers

## Keybindings

| Key | Action |
|-----|--------|
| `j` / `5j` | Move to next result (with count) |
| `k` / `5k` | Move to previous result (with count) |
| `gg` / `5gg` | Jump to result (absolute) |
| `G` / `5G` | Jump to result (absolute) |
| `Enter` / `o` | Open selected result |
| `O` | Open selected result in new tab |
| `y` | Copy selected result URL |
| `H` | Go to previous page |
| `L` | Go to next page |
| `?` | Show help overlay |

## Supported Sites

- **Google Search** - All regional Google domains (google.com, google.co.uk, etc.)
- **YouTube** - Search results page (youtube.com/results)

## How It Works

The extension injects a content script on supported search pages that:
1. Detects the current site and uses appropriate CSS selectors
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
