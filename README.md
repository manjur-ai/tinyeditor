# ⚡ TinyEditor

> Zero-dependency, mobile-first rich text editor — no build step, no bundler, just one script tag.

[![npm version](https://img.shields.io/npm/v/@manjur-ai/tinyeditor)](https://www.npmjs.com/package/@manjur-ai/tinyeditor)
[![size](https://img.shields.io/badge/minified-72KB-green)](https://unpkg.com/@manjur-ai/tinyeditor/tinyeditor.min.js)
[![Zero deps](https://img.shields.io/badge/dependencies-0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-orange)](LICENSE)

---

## Why TinyEditor?

Every existing rich text editor (Quill, TipTap, Editor.js) requires npm + a bundler, ships 200–500KB, and is desktop-first. **TinyEditor** needs just:

```html
<script src="https://unpkg.com/@manjur-ai/tinyeditor@latest/tinyeditor.min.js"></script>
```

No build step. No dependencies. Works offline. Works in TWA / WebView.

**Fully isolated** — the editor never injects HTML outside its own container. The mobile toolbar stays inside `.tfe-wrap`, modals are scoped to `.tfe-*` class names, and event listeners are instance-bound with `contains()` guards.

---

## Features

### ✏️ Editing
| Feature | Detail |
|---|---|
| **Bold / Italic / Heading** | Toolbar buttons + `Ctrl+B` / `Ctrl+I` shortcuts |
| **Indent / Outdent** | Toolbar + `Tab` / `Shift+Tab` (table-cell aware) |
| **Live Markdown shortcuts** | `# ` → h1, `## ` → h2, `- ` → list, `> ` → blockquote, `**text**` → bold, `` `code` `` → inline code, `---` → divider |
| **Rich paste** | Preserves bold, italic, headings, lists, links, images, tables from any website |
| **ChatGPT paste fix** | Code blocks → multiline `<pre>`, lists cleaned (no `<p>` inside `<li>`) |
| **Table keyboard nav** | `Tab` / `Shift+Tab` moves between cells; `Ctrl+A` scoped to cell; `Delete` clamped to cell |

### 📎 Insert Media
| Feature | Detail |
|---|---|
| **URL auto-detect** | Paste any URL — YouTube/Vimeo/Facebook/Instagram/Twitter → iframe, `.jpg/.png/.gif/.webp` → image, `.mp4/.webm` → video, `.pdf` → PDF.js viewer |
| **Ambiguous URL overrides** | When URL has no extension, `🖼 Image` / `🎬 Video` buttons appear automatically |
| **Upload** | Image, Video, PDF — upload to your server |
| **My Files** | Browse uploaded files, lazy-loaded on demand (👁 Show Files) |
| **As Embed / As Link** | Global toggle — insert media inline or as a plain `<a>` link |
| **PDF.js viewer** | PDFs render inline with ← Prev / Next → page navigation (offline, no Google Docs) |

### 📄 Import Doc
| Format | Detail |
|---|---|
| **Markdown (.md)** | Full conversion: headings, bold/italic, tables, code blocks, blockquotes, lists, images, links |
| **HTML (.html)** | Clean import — scripts and event handlers stripped |
| **PDF (.pdf)** | Upload a PDF → rendered inline with PDF.js |

### 🗑 Delete System

Two-level structure for imported content:

```
[✕] md-group          ← delete entire import in one click
 ├─ [✕] h1/h2/h3      ← delete a heading
 ├─ [✕] ul/ol         ← delete a whole list
 ├─ [✕] blockquote    ← delete a blockquote
 ├─ [✕] code block    ← via block-wrap button
 └─ [✕] table         ← via block-wrap button
```

Plain paragraphs have no ✕ button — use `Backspace` / `Delete` as normal.

| Delete method | Works on |
|---|---|
| **✕ group button** | Entire MD/HTML import — one click |
| **✕ block button** | Code blocks, tables, images, videos, PDFs |
| **✕ line button** | h1-h4, ul, ol, blockquote (inside import only) |
| **📍 Mark Start + 🗑** | Mark a start point → click end → delete the range |
| **Keyboard** | Backspace / Delete anywhere; table-cell safe |

### 📱 Mobile
- Fixed bottom toolbar — **always visible**, never hides
- Repositions above soft keyboard using `visualViewport` API
- All delete buttons always visible (no hover needed)
- **Fully isolated** — toolbar stays inside the editor's DOM container

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
  value: '<p>Hello</p>',        // Initial HTML
  placeholder: 'Start writing…',

  // Appearance
  darkMode: 'auto',             // 'auto' | 'dark' | 'light'

  // Limits
  maxSize:      1048576,        // Max content size in bytes (default 1MB)
  maxImageSize: 524288,         // Max image upload (default 500KB)
  maxVideoSize: 10485760,       // Max video upload (default 10MB)

  // Toolbar
  showToolbar: true,
  toolbar: [
    'bold', 'italic', 'heading', 'link',
    'image',        // media modal (URL + upload + my files)
    'importDoc',    // import .md / .html / .pdf
    'indent', 'outdent',
    'markStart', 'deleteSelection',
    // Legacy (still work): 'importMd', 'importHtml'
  ],
  showSaveButton: true,

  // Media upload
  showMediaUrl:    true,
  showMediaUpload: true,
  showMediaFiles:  true,
  uploadUrl:  '/api/upload',    // POST multipart
  listUrl:    '/api/uploads',   // GET → [{name,size,url,uploaded_at}]
  deleteUrl:  '/api/uploads',   // DELETE /api/uploads/:filename

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
editor.getValue()             // → HTML string (UI buttons stripped)
editor.setValue('<p>hi</p>') // → replace content
editor.focus()                // → focus the editor
```

> `getValue()` automatically strips all UI-only elements (`tfe-line-del`, `tfe-del-btn`, `tfe-start-marker`) before returning — the saved HTML is always clean.

---

## Toolbar Reference

| Button | Shortcut | Description |
|---|---|---|
| `bold` | `Ctrl+B` | Bold selected text |
| `italic` | `Ctrl+I` | Italic selected text |
| `heading` | — | Cycle h2 → h3 → p |
| `link` | — | Open media modal in Link mode |
| `image` | — | Open media modal (embed / upload / files) |
| `importDoc` | — | Import .md / .html / .pdf |
| `indent` | `Tab` | Indent block |
| `outdent` | `Shift+Tab` | Outdent block |
| `markStart` | — | Place 📍 range-delete start marker |
| `deleteSelection` | — | Delete 📍 range or current selection |

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

**GET response format:**
```json
[
  {
    "name": "photo.jpg",
    "size": 102400,
    "url": "/api/uploads/file/photo.jpg",
    "uploaded_at": "2026-05-25T10:00:00"
  }
]
```

---

## PDF.js Viewer

PDFs render locally via [PDF.js](https://mozilla.github.io/pdf.js/) — no server, no Google Docs, works offline and in TWA.

Works with:
- **Uploaded files** — `FileReader` → Blob URL → PDF.js
- **External `.pdf` URLs** — paste in the media modal → auto-detected

If you use a service worker, cache PDF.js permanently so it's never re-downloaded:

```js
const LIB_CACHE = 'my-libs-v1'; // never delete this cache

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('pdfjs-dist')) {
    e.respondWith(
      caches.open(LIB_CACHE).then(cache =>
        cache.match(e.request).then(cached =>
          cached || fetch(e.request).then(res => {
            cache.put(e.request, res.clone()); return res;
          })
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

TinyEditor is designed as a standalone component — it does not pollute the host page:

| What | How |
|---|---|
| CSS | Injected once as a `<style>` tag, all classes prefixed `.tfe-*` |
| Mobile toolbar | Stays **inside** `.tfe-wrap` — `position:fixed` via CSS only |
| Modals | Appended to `<body>` but scoped to `.tfe-*` class names |
| Event listeners | `selectionchange` guarded by `this._ed.contains()` — fires only for this instance |
| `getValue()` | Clones the DOM before returning — never mutates the live editor |

---

## Comparison

| | **TinyEditor** | Quill | TipTap | Editor.js |
|---|---|---|---|---|
| Minified size | **72 KB** | 430 KB | 200 KB+ | 300 KB+ |
| Dependencies | **0** | 0 | ProseMirror | Many |
| No build step | **✅** | ✅ | ❌ | ❌ |
| Mobile toolbar | **✅ always visible** | ⚠️ | ⚠️ | ⚠️ |
| PDF viewer | **✅ PDF.js** | ❌ | ❌ | ❌ |
| MD import | **✅** | ❌ | ✅ | ❌ |
| Media upload | **✅ built-in** | ❌ | Plugin | Plugin |
| Dark mode | **✅ auto** | Manual | Manual | Manual |
| TWA / WebView | **✅** | ⚠️ | ⚠️ | ⚠️ |
| DOM isolated | **✅** | ⚠️ | ⚠️ | ⚠️ |

---

## License

MIT © [Manjur](https://github.com/manjur-ai)
