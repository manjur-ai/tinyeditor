# ⚡ TinyEditor

> Zero-dependency, mobile-first rich text editor — no build step, no npm install, just one script tag.

![8KB](https://img.shields.io/badge/size-8KB-green)
![Zero deps](https://img.shields.io/badge/dependencies-0-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## Why TinyEditor?

Every existing rich text editor (Quill, TipTap, Editor.js) requires:
- `npm install` + bundler setup
- 200KB–500KB bundle
- Desktop-first design

**TinyEditor** needs just:
```html
<script src="tinyeditor.js"></script>
```

---

## Features

| Feature | Description |
|---|---|
| **Bold / Italic / Heading** | Toolbar buttons + Ctrl+B / Ctrl+I shortcuts |
| **Auto URL detection** | Paste a link → shows 👁 preview button |
| **Link preview cards** | Fetches title, image, description inline |
| **Inline images** | Paste URL or upload file (base64, max 500KB) |
| **Image paste** | Ctrl+V an image directly into editor |
| **Import .md** | Pick a markdown file → converts to HTML at cursor |
| **Import HTML** | Pick an HTML file → strips scripts, inserts clean content |
| **Indent / Outdent** | → ← toolbar buttons + Tab / Shift+Tab keyboard shortcut |
| **Size indicator** | Live KB counter, warns at 70% / 90% of limit |
| **Dark / Light mode** | Auto-detects system preference |
| **Mobile-first** | Built for touch, works on desktop too |
| **Zero dependencies** | No jQuery, no React, no build step |

---

## Quick Start

### Browser (no build step)
```html
<div id="my-editor"></div>

<script src="https://unpkg.com/@manjur-ai/tinyeditor/tinyeditor.js"></script>
<script>
  const editor = new TinyEditor({
    target: '#my-editor',
    onSave: (html) => console.log('Saved:', html),
  });
</script>
```

### CommonJS / Node bundler
```bash
npm install @manjur-ai/tinyeditor
```
```js
const TinyEditor = require('tinyeditor');
// or
import TinyEditor from 'tinyeditor';
```

---

## Options

```js
const editor = new TinyEditor({
  // Required
  target: '#my-editor',        // CSS selector or DOM element

  // Content
  value: '<p>Hello</p>',       // Initial HTML
  placeholder: 'Start writing...', // Placeholder text

  // Limits
  maxSize: 1048576,             // Max note size in bytes (default: 1MB)
  maxImageSize: 524288,         // Max image size in bytes (default: 500KB)

  // URL Preview
  linkPreviewUrl: '/api/link-preview',
  // Your backend endpoint: GET /api/link-preview?url=<encoded>
  // Returns: { title, description, image, domain }
  // Set to null to disable preview buttons

  // Appearance
  darkMode: 'auto',             // 'auto' | 'dark' | 'light'

  // Toolbar
  showToolbar: true,
  toolbar: ['bold','italic','heading','link','image','importMd','importHtml'],
  showSaveButton: true,

  // Callbacks
  onChange: (html) => {},       // Called on every change
  onSave:   (html) => {},       // Called when Save is clicked
});
```

---

## API

```js
editor.getValue()          // → current HTML string
editor.setValue('<p>x</p>') // → set content
editor.focus()             // → focus the editor
```

---

## Link Preview Backend

To enable the 👁 preview button, you need a backend endpoint.

**Python (Flask) example — included in Toolfy Task:**
```python
@app.route("/api/link-preview")
def link_preview():
    url = request.args.get("url", "")
    # fetch URL, read og: meta tags, return JSON
    return jsonify({
        "title": "...",
        "description": "...",
        "image": "https://...",
        "domain": "youtube.com"
    })
```

**Node.js (Express) example:**
```js
const cheerio = require('cheerio');
const axios = require('axios');

app.get('/api/link-preview', async (req, res) => {
  const { url } = req.query;
  const { data } = await axios.get(url, { timeout: 5000 });
  const $ = cheerio.load(data);
  res.json({
    title:       $('meta[property="og:title"]').attr('content') || $('title').text(),
    description: $('meta[property="og:description"]').attr('content') || '',
    image:       $('meta[property="og:image"]').attr('content') || '',
    domain:      new URL(url).hostname.replace('www.', ''),
  });
});
```

---

## CSS Custom Properties

Override theme variables on the container:

```css
#my-editor {
  --tfe-acc:  #4f8ef7;   /* accent / link color */
  --tfe-bg:   #0f0f0f;   /* background */
  --tfe-sur:  #141414;   /* surface (preview cards) */
  --tfe-sur2: #1e1e1e;   /* surface 2 (editor bg, toolbar buttons) */
  --tfe-bdr:  #2d2d2d;   /* border color */
  --tfe-txt:  #e0e0e0;   /* text color */
  --tfe-mut:  #888888;   /* muted text */
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+S` | Save |
| `Tab` | Indent current block |
| `Shift+Tab` | Outdent current block |
| `Ctrl+V` | Paste image directly |

---

## Comparison

| | **TinyEditor** | Quill | TipTap | Editor.js |
|---|---|---|---|---|
| Size | **23KB** | 430KB | 200KB+ | 300KB+ |
| Dependencies | **0** | 0 | ProseMirror | Many |
| URL preview | **✅ free** | ❌ | 💰 paid | Plugin |
| MD import | **✅** | ❌ | ✅ | ❌ |
| HTML import | **✅** | ✅ | ✅ | ❌ |
| Mobile-first | **✅** | ⚠️ | ⚠️ | ⚠️ |
| Dark mode | **✅ auto** | Manual | Manual | Manual |
| No build step | **✅** | ✅ | ❌ | ❌ |

---

## License

MIT © [Manjur](https://github.com/manjur-ai)
