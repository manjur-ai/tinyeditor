# ⚡ TinyEditor

> Zero-dependency, mobile-first rich text editor with URL preview, image upload, Markdown shortcuts, and media embeds. ~99KB. No build step.

[![npm version](https://img.shields.io/npm/v/@manjur-ai/tinyeditor)](https://www.npmjs.com/package/@manjur-ai/tinyeditor)
[![size](https://img.shields.io/badge/minified-99KB-green)](https://unpkg.com/@manjur-ai/tinyeditor/tinyeditor.min.js)
[![Zero deps](https://img.shields.io/badge/dependencies-0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-orange)](LICENSE)

---

## Why TinyEditor?

Every existing rich text editor (Quill, TipTap, Editor.js) requires npm + a bundler, ships 200–500KB, and is desktop-first. **TinyEditor** needs just:

```html
<script src="https://unpkg.com/@manjur-ai/tinyeditor@latest/tinyeditor.min.js"></script>
```

No build step. No dependencies. Works offline. Works in TWA / WebView.

**Fully isolated** — the editor never injects HTML outside its own container. The mobile toolbar stays inside `.tfe-wrap`, modals are scoped to `.tfe-*` class names, and event listeners are instance-bound with `contains()` guards. Passes 28-point isolation audit.

---

## Features

### ✏️ Editing
| Feature | Detail |
|---|---|
| **Bold / Italic / Heading** | Toolbar buttons + `Ctrl+B` / `Ctrl+I` shortcuts |
| **Indent / Outdent** | Toolbar + `Tab` / `Shift+Tab` (table-cell aware) |
| **Live Markdown shortcuts** | `# ` → h1, `## ` → h2, `- ` → list, `> ` → blockquote, `**bold**`, `` `code` ``, `---` → hr |
| **Rich paste** | Preserves bold, italic, headings, lists, links, images, tables from any website |
| **ChatGPT paste fix** | Code blocks → multiline `<pre>`, lists cleaned |
| **Table keyboard nav** | `Tab` / `Shift+Tab` moves between cells; `Ctrl+A` scoped to cell; `Delete` / `Backspace` are clamped to the cell |
| **Native delete/backspace** | `Delete` and `Backspace` behave like document-editor keys across text, inline tags, paragraphs, lists, and adjacent media blocks |
| **Selection start marker** | `📍` marks a range start for toolbar deletion; pressing any key cancels marker mode so the range cannot drift |

### 📎 Insert Media (`importMedia`)
| Feature | Detail |
|---|---|
| **URL auto-detect** | Paste any URL — YouTube/Vimeo/Facebook/Instagram/Twitter → iframe, image → `<img>`, video → `<video>`, `.pdf` → PDF.js viewer |
| **4 override buttons** | Ambiguous URL (no extension) → choose 🖼 Image / 🎬 Video / 📑 PDF / 🔗 Link |
| **Required label** | Every insert requires a display name — used as `alt`, link text, PDF title |
| **Upload** | Image, Video, PDF — uploaded from Insert Media and saved with `label_YYYYMMDDHHmmssSSS.ext` filename |
| **Auto-compress** | ☑ Auto-compress checkbox — image → JPEG 70% quality, video → 800kbps re-encode, PDF → 150dpi |
| **My Files** | Browse uploaded files, lazy-loaded on demand |
| **As Embed / As Link** | Global toggle — insert inline or as a plain `<a>` link |
| **PDF.js viewer** | PDFs render inline through bundled local PDF.js, preloaded for faster warm-cache opens; controlled by `pdfPageMode` |

### 📄 Import Doc (`importDoc`)
| Format | Detail |
|---|---|
| **Markdown (.md)** | Full conversion: headings, bold/italic, tables, code blocks, blockquotes, lists, images, links |
| **HTML (.html)** | Clean import — scripts and event handlers stripped |

PDF import intentionally lives in **Insert Media**, not Import Doc, because PDFs are rendered as media previews rather than converted document content.

### 🗑 Delete System
Two-level structure for imported content — plain paragraphs use keyboard only:

```
[✕] md-group          ← delete entire import in one click
 ├─ [✕] h1/h2/h3      ← delete heading (top-right corner, inside element)
 ├─ [✕] ul/ol         ← delete whole list
 ├─ [✕] blockquote    ← delete blockquote
 ├─ [✕] code block    ← via block-wrap button (top-right, inside)
 └─ [✕] table/image/video/pdf  ← via block-wrap button
```

| Delete method | Works on |
|---|---|
| **✕ group button** | Entire MD/HTML import — one click |
| **✕ block button** | Code, table, image, video, PDF — inside block, always visible on mobile |
| **✕ line button** | h1-h4, ul, ol, blockquote (inside import only) |
| **📍 Mark Start + 🗑** | Mark a start → click end → delete range |
| **🗑 toolbar button** | Selection delete / marked range / forward delete at cursor |
| **Keyboard Delete** | Deletes selected content; at a collapsed caret it deletes forward natively, including block merges, and removes the next atomic media/import block when needed |
| **Keyboard Backspace** | Deletes selected content; at a collapsed caret it deletes backward natively, including block/list merges, and removes the previous atomic media/import block when needed |
| **Mobile backspace** | Soft-keyboard `deleteContentBackward` uses the same previous-atomic-block fallback |

When `📍` selection-start mode is active, any keyboard key or mobile `beforeinput` action cancels marker mode and consumes that input. Use the toolbar `🗑` button to delete the marked range.

### Read-only display mode

TinyEditor can be shown as read-only by disabling editing in your wrapper/app. In read-only mode, hide the toolbar/save controls and inline delete controls, and set the editor `contenteditable` state to `false`. Saved PDF previews, imported Markdown/HTML groups, media blocks, and text remain visible; keyboard delete/backspace and inline delete buttons should not change content.

### 📱 Mobile
- Fixed bottom toolbar — **always visible**, never hides, fills full width
- Repositions above soft keyboard using `visualViewport` API
- All ✕ delete buttons always visible (no hover needed) — positioned inside blocks, not outside
- **Fully isolated** — toolbar stays inside `.tfe-wrap` DOM

### ⚡ Performance
All operations benchmarked under **2ms** even at 1000+ nodes:

| Operation | Time |
|---|---|
| `getValue()` — 1000 paragraphs | 0.37ms |
| `setValue()` — 1000 paragraphs | 0.92ms |
| `_syncLineDelButtons()` — 200 headings | 0.96ms |
| `_mdToHtml()` — 500 list items | 0.27ms |
| `_sanitizePastedHtml()` — 100 elements | 1.48ms |

Key optimisations: O(1) `firstChild` check instead of `querySelector`, fast-path `getValue()` (no clone when no UI buttons present), string length instead of `Blob` for size measurement.

### ⏳ Spinners
Every async operation shows a spinner with progress messages:
- Upload — real `%` from `xhr.upload.onprogress`
- Image compress — `Converting to JPEG…` → `Compressed! Saved X%`
- Video compress — `Analysing frames…` → `Re-encoding…` → `Done! Saved X%`
- PDF load — `Loading PDF viewer…` → `Loading document…` → `Rendering…`
- File list / delete — `Loading your files…` / `Deleting file…`

---

## Quick Start

```html
<div id="editor"></div>

<script src="https://unpkg.com/@manjur-ai/tinyeditor@latest/tinyeditor.min.js"></script>
<script>
  const editor = new TinyEditor({
    target: '#editor',
    value: '<p>Hello world</p>',
    onSave: (html) => console.log(html),
  });
</script>
```

---

## Options

```js
const editor = new TinyEditor({
  // Required
  target: '#editor',            // CSS selector or DOM element

  // Content
  value: '<p>Hello</p>',
  placeholder: 'Start writing…',

  // Appearance
  darkMode: 'auto',             // 'auto' | 'dark' | 'light'
  width: '100%',                // editor width, e.g. '400px', '80%' (default: '100%')

  // Size limits
  maxSize:      10485760,       // Max content size in bytes (default 10MB)
  maxImageSize: 1048576,        // Max image/pdf upload (default 1MB)
  maxVideoSize: 1048576,        // Max video upload (default 1MB)
  pdfPageMode:  'single',       // 'single' = first page + Prev/Next, 'all' = every page stacked

  // Toolbar
  showToolbar: true,
  toolbar: [
    'bold', 'italic', 'heading',
    'importMedia',   // media modal — URL + upload + my files
    'importDoc',     // import .md / .html
    'indent', 'outdent',
    'markStart', 'deleteSelection',
    // Legacy aliases (still work): 'image', 'link', 'importMd', 'importHtml'
  ],
  showSaveButton: true,

  // Media upload
  showMediaUrl:    true,
  showMediaUpload: true,
  showMediaFiles:  true,
  uploadUrl:  '/api/upload',    // POST multipart
  listUrl:    '/api/uploads',   // GET → [{name,size,url,uploaded_at}]
  deleteUrl:  '/api/uploads',   // DELETE /api/uploads/:filename
  mediaBasePath: '',            // Optional prefix for file URLs

  // Link preview
  linkPreviewUrl: '/api/link-preview',
  // GET ?url=<encoded> → { title, description, image, domain }

  // Callbacks
  onChange: (html) => {},
  onSave:   (html) => {},
});
```

---

## API

```js
editor.getValue()             // → HTML string (all UI buttons stripped, clean output)
editor.setValue('<p>hi</p>') // → replace content
editor.focus()                // → focus the editor
```

`getValue()` uses a fast-path: if no UI elements are present (most reads), it returns `innerHTML` directly without cloning. Only strips when markers/buttons exist.

---

## Toolbar Reference

| Button | Shortcut | Description |
|---|---|---|
| `bold` | `Ctrl+B` | Bold selected text |
| `italic` | `Ctrl+I` | Italic selected text |
| `heading` | — | Cycle h2 → h3 → p |
| `importMedia` | — | Open media modal (URL + upload + my files) |
| `importDoc` | — | Import .md / .html |
| `indent` | `Tab` | Indent block |
| `outdent` | `Shift+Tab` | Outdent block |
| `markStart` | — | Place 📍 range-delete start marker; any key cancels marker mode |
| `deleteSelection` | — | Delete selection / marked range / forward-delete at cursor |

---

## Live Markdown Shortcuts

Type at the start of a line:

| Type | Result |
|---|---|
| `# ` | `<h1>` |
| `## ` | `<h2>` |
| `### ` | `<h3>` |
| `- ` | `<ul><li>` |
| `> ` | `<blockquote>` |
| `---` | `<hr>` |
| `**text**` | `<strong>` |
| `*text*` | `<em>` |
| `` `text` `` | `<code>` |

---

## Media Upload API

Your backend needs 3 endpoints:

```
POST   /api/upload              → multipart file upload
GET    /api/uploads             → list files (JSON array)
DELETE /api/uploads/:filename   → delete file
```

Uploaded files are renamed to `label_YYYYMMDDHHmmssSSS.ext` automatically.

**GET response format:**
```json
[
  {
    "name": "company_logo_20260527033822619.jpg",
    "size": 102400,
    "url": "/api/uploads/file/company_logo_20260527033822619.jpg",
    "uploaded_at": "2026-05-27T03:38:22"
  }
]
```

---

## PDF.js Viewer

PDFs render locally via bundled [PDF.js](https://mozilla.github.io/pdf.js/) - no CDN, no Google Docs, no server viewer, works offline and in TWA.

TinyEditor preloads the local PDF.js script and worker from `pdfjs/pdf.min.js` and `pdfjs/pdf.worker.min.js`. After the first load, normal browser/service-worker caching makes warm opens much faster and avoids network dependency.

`pdfPageMode: 'single'` shows page 1 with Prev/Next controls. `pdfPageMode: 'all'` renders every page one after another.

When `uploadUrl` is configured, PDFs are uploaded to your server and stored with a persistent URL. Without `uploadUrl`, PDFs are embedded as data URLs so saved HTML can still render after reopen.

Service worker caching tip - cache bundled PDF.js permanently:

```js
const LIB_CACHE = 'my-libs-v1'; // never delete this cache

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/pdfjs/')) {
    e.respondWith(
      caches.open(LIB_CACHE).then(c =>
        c.match(e.request).then(r =>
          r || fetch(e.request).then(res => { c.put(e.request, res.clone()); return res; })
        )
      )
    );
  }
});
```

---

## CSS Custom Properties

```css
#editor {
  --tfe-acc:  #4f8ef7;   /* accent / link color */
  --tfe-bg:   #0f0f0f;   /* page background */
  --tfe-sur:  #141414;   /* surface (toolbar, modal bg) */
  --tfe-sur2: #1e1e1e;   /* surface 2 (editor bg, cards) */
  --tfe-bdr:  #2d2d2d;   /* border color */
  --tfe-txt:  #e0e0e0;   /* primary text */
  --tfe-mut:  #888888;   /* muted / placeholder text */
}
```

---

## DOM Isolation

TinyEditor is designed as a fully standalone component — it does not pollute the host page:

| What | How |
|---|---|
| CSS | Injected once as a `<style>` tag; all classes prefixed `.tfe-*`; editor sets own `color` to prevent host bleed |
| Mobile toolbar | Stays **inside** `.tfe-wrap` — `position:fixed` via CSS class only |
| Modals | Appended to `<body>` but scoped to `.tfe-*` class names |
| Event listeners | `selectionchange` guarded by `this._ed.contains()` — fires only for this instance |
| `getValue()` | Fast-path skips clone when clean; slow-path clones before stripping UI buttons |
| Multiple instances | No shared state — 3 editors on the same page work independently |
| Global scope | Only `TinyEditor` added to `window` |
| Offline | All core features work with network blocked; bundled PDF.js is local and preloaded |

---

## Comparison

| | **TinyEditor** | Quill | TipTap | Editor.js |
|---|---|---|---|---|
| Minified size | **99 KB** | 430 KB | 200 KB+ | 300 KB+ |
| Dependencies | **0** | 0 | ProseMirror | Many |
| No build step | **✅** | ✅ | ❌ | ❌ |
| Mobile toolbar | **✅ always visible** | ⚠️ | ⚠️ | ⚠️ |
| PDF viewer | **✅ PDF.js** | ❌ | ❌ | ❌ |
| MD import | **✅** | ❌ | ✅ | ❌ |
| Media upload | **✅ built-in** | ❌ | Plugin | Plugin |
| Auto-compress | **✅ image/video/pdf** | ❌ | ❌ | ❌ |
| Forward delete | **✅** | ⚠️ | ✅ | ⚠️ |
| Dark mode | **✅ auto** | Manual | Manual | Manual |
| TWA / WebView | **✅** | ⚠️ | ⚠️ | ⚠️ |
| DOM isolated | **✅ audited** | ⚠️ | ⚠️ | ⚠️ |
| Performance | **✅ <2ms all ops** | ⚠️ | ⚠️ | ⚠️ |

---

## License

MIT © [Manjur](https://github.com/manjur-ai)
