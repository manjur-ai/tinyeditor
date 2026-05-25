# Changelog

## v0.1.0 (2026-05-25)

### Features
- Rich text editor with `contenteditable` div
- Toolbar: Bold, Italic, Heading, Link, Image, Import MD, Import HTML, Indent, Outdent
- Live Markdown shortcuts (# h1, ## h2, **bold**, *italic*, `code`, >, -, ---)
- Auto URL detection with 👁 inline preview button
- Link preview cards (title, image, description, domain) via configurable backend
- Inline image support: paste from clipboard, URL, or file upload (max 500KB)
- Import .md files — converts to HTML at cursor position
- Import .html files — strips scripts/handlers, inserts clean content
- Indent/Outdent via toolbar buttons → ← or Tab/Shift+Tab keyboard
- Tab key stays inside editor (no focus loss)
- Live size indicator (KB counter, warns at 70%/90%)
- Dark mode, Light mode, Auto (system preference)
- Re-edit existing HTML — all formatting preserved on reload
- Preview cards restored as non-editable on load
- CommonJS + AMD + Browser global module format
- Zero dependencies, ~23KB, no build step

## v0.1.1 (2026-05-25)

### Added
- **Media Modal** — 📎 button opens media insertion dialog with 3 sections:
  - URL embed (YouTube, Vimeo, Facebook, Instagram, Twitter/X, direct image/video)
  - File upload (image or video)
  - From configured base path (`mediaBasePath` option)
- **Smart URL → embed detection:**
  - YouTube (watch, youtu.be, shorts) → responsive iframe
  - Vimeo → responsive iframe
  - Facebook video → iframe
  - Instagram post/reel → iframe
  - Twitter/X status → iframe
  - .mp4/.webm/.ogg → `<video controls>`
  - .jpg/.png/.gif/.webp → `<img>`
  - Any other URL → `<a>` link
- **Video file upload** support (max 10MB, configurable)
- **`mediaBasePath`** option — configure base path for file references
- **`maxVideoSize`** option (default 10MB)
- **Configurable `previewMode`**: `'smart'` | `'backend'` | `'domain-only'` | `'none'`
- Auto-detect URLs always runs; preview button gated by `previewMode`

## v0.1.2 (2026-05-25)

### Added
- **Rich paste from any website** — copies formatting, headings, lists, links, images, tables
- **ChatGPT output paste** — code blocks converted to styled `<pre><code>`, bold/italic/lists preserved
- **DOM-based HTML sanitizer** — safer and more reliable than regex approach
- **Security** — strips `<script>`, `<iframe>`, event handlers, `javascript:` URLs on paste
- **Table support** — paste Wikipedia/ChatGPT tables with proper styling
- **Blockquote** preserved from pasted content
- Plain text paste still works via browser default
