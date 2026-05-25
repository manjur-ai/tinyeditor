# TinyEditor — Shortcuts & Features Guide

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+S` | Save |
| `Tab` | Indent current block (+24px) |
| `Shift+Tab` | Outdent current block (-24px) |

---

## 📝 Live Markdown Shortcuts

Type these at the **start of a line** then press `Space`:

| Type | Press | Result |
|---|---|---|
| `#` | Space | Heading 1 |
| `##` | Space | Heading 2 |
| `###` | Space | Heading 3 |
| `-` | Space | Bullet list item |
| `*` | Space | Bullet list item |
| `>` | Space | Blockquote |
| `---` | Enter | Horizontal rule `<hr>` |

Type these **anywhere** then press `Space`:

| Type | Press | Result |
|---|---|---|
| `**text**` | Space | **Bold** |
| `*text*` | Space | *Italic* |
| `_text_` | Space | *Italic* |
| `` `text` `` | Space | `inline code` |

> Note: Shortcuts only trigger at start of line for block elements.
> `##` in the middle of a sentence will NOT convert.

---

## 🔧 Toolbar Buttons

| Button | Action |
|---|---|
| **B** | Bold (toggle) |
| *I* | Italic (toggle) |
| H | Heading 2 (toggle) |
| 🔗 | Insert link (prompts for URL + text) |
| 🖼 | Insert image (URL or file upload) |
| 📄 | Import `.md` file at cursor |
| 🌐 | Import `.html` file at cursor (scripts stripped) |
| → | Indent current block |
| ← | Outdent current block |

---

## 🔗 URL Preview

1. Paste any URL in the editor
2. After 800ms debounce, URL is auto-detected and wrapped
3. A 👁 button appears next to the URL
4. Click 👁 → fetches preview (title, image, description, domain)
5. Preview card renders inline — click it to open the URL

> Requires `linkPreviewUrl` option to be set pointing to your backend.

---

## 🖼 Images

**3 ways to add images:**

1. **Paste from clipboard** — `Ctrl+V` an image directly
2. **URL** — click 🖼 toolbar button → paste image URL
3. **File upload** — click 🖼 → cancel the URL prompt → pick file

Max image size: 500KB (configurable via `maxImageSize` option)

---

## 📄 Import Markdown (.md)

1. Click 📄 button
2. Pick any `.md` or `.txt` file
3. Content is converted to HTML and inserted at cursor position

**Supported conversions:**

| Markdown | HTML |
|---|---|
| `# H1` | `<h1>` |
| `## H2` | `<h2>` |
| `**bold**` | `<strong>` |
| `*italic*` | `<em>` |
| `[text](url)` | `<a>` |
| `![alt](url)` | `<img>` |
| `- item` | `<ul><li>` |
| `---` | `<hr>` |

---

## 🌐 Import HTML

1. Click 🌐 button
2. Pick any `.html` or `.htm` file
3. Content is sanitised (all `<script>` and event handlers removed)
4. Clean HTML inserted at cursor position

---

## 📏 Size Limit

- Live size indicator shows `X.X KB / 1024 KB`
- Turns **yellow** at 70% capacity
- Turns **red** at 90% capacity
- Save is blocked if over the limit
- Default max: 1MB (configurable via `maxSize` option)

---

## 💾 Output Format

The editor outputs **HTML string**.

```js
const html = editor.getValue();
// <h2>My Note</h2><p><strong>bold</strong> text</p>...
```

To display saved notes:
```js
document.getElementById('display').innerHTML = savedNoteHtml;
```

---

## 🔌 Public API

```js
const editor = new TinyEditor({ target: '#div', ... });

editor.getValue()          // returns current HTML string
editor.setValue('<p>x</p>') // sets content (replaces all)
editor.focus()             // focuses the editor
```

---

## 🎨 CSS Custom Properties (theming)

```css
#my-editor-container {
  --tfe-acc:  #4f8ef7;   /* accent / link / heading color */
  --tfe-bg:   #0f0f0f;   /* page background */
  --tfe-sur:  #141414;   /* surface (preview cards) */
  --tfe-sur2: #1e1e1e;   /* editor background, toolbar buttons */
  --tfe-bdr:  #2d2d2d;   /* border color */
  --tfe-txt:  #e0e0e0;   /* primary text */
  --tfe-mut:  #888888;   /* muted / placeholder text */
}
```

---

## ⚙️ Full Options

```js
new TinyEditor({
  target:         '#my-editor',     // CSS selector or DOM element (required)
  value:          '<p>Hello</p>',   // Initial HTML content
  placeholder:    'Start writing...', // Placeholder text
  maxSize:        1048576,          // Max note bytes (default 1MB)
  maxImageSize:   524288,           // Max image bytes (default 500KB)
  darkMode:       'auto',           // 'auto' | 'dark' | 'light'
  linkPreviewUrl: '/api/link-preview', // Backend URL for link previews (null = disabled)
  onChange:       (html) => {},     // Called on every change
  onSave:         (html) => {},     // Called on Save button click / Ctrl+S
  showSaveButton: true,             // Show/hide save button
  showToolbar:    true,             // Show/hide toolbar
  toolbar: [                        // Customise toolbar buttons and order
    'bold', 'italic', 'heading',
    'link', 'image',
    'importMd', 'importHtml',
    'indent', 'outdent'
  ],
});
```

---

## 👁 Preview Modes (previewMode option)

| Mode | Description | Backend needed |
|---|---|---|
| `'smart'` | YouTube/Vimeo/GitHub direct + corsproxy fallback | ❌ No |
| `'backend'` | Your own API via `linkPreviewUrl` | ✅ Yes |
| `'domain-only'` | Shows favicon + domain only, zero network | ❌ No |
| `'none'` | Disables preview button (URLs still render as links) | ❌ No |

```js
new TinyEditor({
  previewMode: 'smart',        // works out of the box, no backend
  // previewMode: 'backend',   // use your own API
  // previewMode: 'domain-only', // ultra lightweight
  // previewMode: 'none',      // disable previews entirely
  linkPreviewUrl: '/api/link-preview', // only needed for 'backend' mode
});
```
