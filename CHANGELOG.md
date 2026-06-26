# Changelog

## v0.1.16 (2026-06-26)

### Added
- **Quadrilateral crop modal** — after image capture/upload, a crop UI opens with draggable corner and side handles, semi-transparent outside overlay, and Apply Crop / Full Image / Cancel buttons. Controlled by `showCrop` option (default `true`).
- **Camera button** — 📷 Camera button in Insert Media upload section fires `<input capture="environment">` for native camera capture on mobile.
- **Multi-image selection** — file input allows selecting multiple images at once; each uploads independently and skips the crop modal.
- **Image thumbnails in file list** — `My Files` rows show a thumbnail preview; reads `thumb_url` from API response, falls back to the file URL for images.
- **`tfe-modal-overlay` CSS class** — reusable overlay for modals (crop, etc.) with centered flex layout.
- **`tfe-crop-box`**, **`tfe-media-file-thumb`** CSS classes for crop modal and file thumbnails.

### Changed
- **Label optional** — display name is no longer required for URL or upload inserts. Removed red asterisk and validation. In link mode, falls back to the URL if no label provided.
- **Default focus on Camera button** — media modal opens with Camera button focused instead of the URL input.
- **Image compression quality 70% → 92%**, max dimension 1920px → 1536px for better quality at slightly smaller max size.
- **`_compressImage()`** refactored: uses `Math.max(w, h)` for longest side calculation, simplified resize logic.
- **Package includes `pdfjs/`** in `files` array for npm distribution.
- **Build script** added: `"build": "node ../scripts/build-tinyeditor.js"` with `terser` devDependency.

### Fixed
- Label field no longer shakes/refuses on empty input.

## v0.1.14 (2026-06-26)

### Fixed
- PDF canvas width constrained to 100% in `pdfCanvasWrap` so PDFs don't overflow on small screens.
- Temp editor kept alive during async PDF render to prevent race conditions.

## v0.1.13 (2026-06-26)

### Fixed
- Same PDF canvas width fix as v0.1.14 (follow-up with additional PDF render stability).

## v0.1.12 (2026-06-26)

### Fixed
- **Editor text color isolation** — editor now sets its own `color` via CSS `!important` to prevent host page bleed. Passes 28-point DOM isolation audit.

## v0.1.11 (2026-06-26)

### Fixed
- **`getValue()` strips all UI buttons** — removed marker, close, delete buttons from output HTML.
- **Table keyboard navigation** — `Ctrl+A` scoped to current cell, `Backspace`/`Delete` clamped inside cell.
- **Deep text cursor placement** — `deepTextNode` properly locates cursor when editor has nested elements.

## v0.1.10 (2026-06-26)

### Added
- **PDF upload button** in Insert Media — dedicated PDF upload alongside Image/Video.
- **Stable delete buttons** — delete controls positioned inside blocks, no longer floating/offset.

## v0.1.9 (2026-06-26)

### Fixed
- **`getValue()` strips start marker** — `📍` marker character and its container are removed from output HTML.

## v0.1.8 (2026-06-26)

### Fixed
- Stability improvements and bug fixes.

## v0.1.7 (2026-06-26)

### Added
- **PDF embed via PDF.js** — PDFs rendered inline through bundled local PDF.js viewer with page navigation.
- **Import Doc modal** — unified UI for importing `.md` and `.html` files with file-type badges.

## v0.1.6 (2026-06-26)

### Added
- **Lazy-loaded My Files** — "Show Files" / "Hide Files" toggle in Insert Media to avoid loading file lists on every open.
- **Delete buttons on inserted blocks** — per-block `✕` delete buttons for code blocks, tables, images, videos.
- **Import improvements** — markdown tables, blockquotes, and code blocks properly converted.
- **Line delete** — per-line `✕` delete buttons for h1-h4, ul, ol, blockquote within imports.
- **MD group delete** — `✕` button deletes entire MD/HTML import group at once.
- **Multiline selection delete** — select across multiple lines/paragraphs and delete via toolbar.

## v0.1.5 (2026-06-26)

### Added
- **Line delete** — per-line `✕` delete buttons inside import groups.
- **Multiline selection delete** — toolbar delete handles multiline and cross-block selections.
- **MD group delete** — single-click removal of entire imported block group.

## v0.1.4 (2026-06-26)

### Added
- **Delete buttons on inserted blocks** — per-block `✕` controls for code, table, image, video, PDF.
- **Import: Markdown tables, blockquotes, code blocks** — full MD spec support in import.

## v0.1.3 (2026-06-26)

### Added
- Enhanced markdown import with table, blockquote, and code block support.

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
