/*!
 * TinyEditor v0.1.0
 * Zero-dependency, mobile-first rich text editor
 * with URL preview, image upload, MD/HTML import
 *
 * https://github.com/manjur-ai/tinyeditor
 * MIT License
 */

(function (global, factory) {
  typeof module !== 'undefined' && module.exports
    ? (module.exports = factory())          // CommonJS (Node / bundlers)
    : typeof define === 'function' && define.amd
    ? define(factory)                        // AMD
    : (global.TinyEditor = factory());     // Browser global
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ── Default options ────────────────────────────────────────────────────────
  const DEFAULTS = {
    target:         '#tinyeditor',  // CSS selector or DOM element
    value:          '',                // Initial HTML content
    placeholder:    'Start writing...', // Placeholder text
    maxSize:        1048576,           // Max note size in bytes (1MB)
    maxImageSize:   524288,            // Max image size in bytes (500KB)
    maxVideoSize:   10485760,          // Max video upload size (10MB)
    mediaBasePath:  '',                // Optional base path e.g. '/uploads/'
    allowedImageTypes: ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml'],
    allowedVideoTypes: ['video/mp4','video/webm','video/ogg'],
    darkMode:       'auto',            // 'auto' | 'dark' | 'light'
    linkPreviewUrl: null,              // URL of your link-preview API endpoint
    //   GET {linkPreviewUrl}?url=<encoded>
    //   returns { title, description, image, domain }
    onChange:       null,              // fn(html) — called on every change
    onSave:         null,              // fn(html) — called when Save is clicked
    showSaveButton: true,
    showToolbar:    true,
    toolbar: ['bold','italic','heading','link','image','importMd','importHtml','indent','outdent'],
  };

  // ── CSS injected once ──────────────────────────────────────────────────────
  const CSS = `
.tfe-wrap{display:flex;flex-direction:column;gap:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-sizing:border-box}
.tfe-wrap *{box-sizing:border-box}
.tfe-toolbar{display:flex;gap:4px;padding:6px 0 8px;border-bottom:1px solid var(--tfe-bdr,#2d2d2d);flex-wrap:wrap}
.tfe-btn{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;color:var(--tfe-txt,#e0e0e0);font-size:13px;font-weight:600;padding:4px 9px;cursor:pointer;min-width:30px;transition:background .15s;line-height:1.4}
.tfe-btn:hover{background:var(--tfe-acc,#4f8ef7);color:#fff;border-color:var(--tfe-acc,#4f8ef7)}
.tfe-btn:active{transform:scale(.95)}
.tfe-size{font-size:10px;color:var(--tfe-mut,#888);text-align:right;padding:2px 0 4px}
.tfe-editor{min-height:160px;overflow-y:auto;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;padding:12px;font-size:14px;line-height:1.7;outline:none;color:var(--tfe-txt,#e0e0e0);word-break:break-word}
.tfe-editor:empty::before{content:attr(data-placeholder);color:var(--tfe-mut,#888);pointer-events:none}
.tfe-editor h1{font-size:20px;font-weight:800;margin:8px 0 4px}
.tfe-editor h2{font-size:17px;font-weight:700;margin:6px 0 3px;color:var(--tfe-acc,#4f8ef7)}
.tfe-editor h3{font-size:15px;font-weight:700;margin:4px 0 2px}
.tfe-editor p{margin:2px 0}
.tfe-editor ul{padding-left:20px;margin:4px 0}
.tfe-editor a{color:var(--tfe-acc,#4f8ef7);text-decoration:underline}
.tfe-editor img{max-width:100%;border-radius:4px;margin:4px 0;display:block}
.tfe-editor hr{border:none;border-top:1px solid var(--tfe-bdr,#2d2d2d);margin:8px 0}
.tfe-editor code{background:var(--tfe-sur2,#1e1e1e);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px;color:var(--tfe-acc,#4f8ef7)}
.tfe-editor blockquote{border-left:3px solid var(--tfe-acc,#4f8ef7);padding:4px 12px;margin:4px 0;color:var(--tfe-mut,#888)}
.tfe-editor video{max-width:100%;border-radius:6px;margin:4px 0;display:block;background:#000}
.tfe-editor iframe{max-width:100%;border-radius:6px;margin:4px 0;display:block;border:none}
.tfe-media-modal{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center}
.tfe-media-box{background:var(--tfe-sur,#141414);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:12px;padding:20px;width:340px;max-width:95vw}
.tfe-media-title{font-size:15px;font-weight:700;color:var(--tfe-txt,#e0e0e0);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}
.tfe-media-section{margin-bottom:14px}
.tfe-media-label{font-size:11px;font-weight:700;color:var(--tfe-mut,#888);letter-spacing:.06em;margin-bottom:6px}
.tfe-media-row{display:flex;gap:6px}
.tfe-media-input{flex:1;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;color:var(--tfe-txt,#e0e0e0);padding:8px 10px;font-size:13px;outline:none}
.tfe-media-input:focus{border-color:var(--tfe-acc,#4f8ef7)}
.tfe-media-btn{background:var(--tfe-acc,#4f8ef7);border:none;border-radius:6px;color:#fff;font-size:12px;font-weight:700;padding:8px 12px;cursor:pointer;white-space:nowrap}
.tfe-media-btn-sec{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;color:var(--tfe-txt,#e0e0e0);font-size:12px;font-weight:600;padding:8px 12px;cursor:pointer;flex:1}
.tfe-media-btn-sec:hover{border-color:var(--tfe-acc,#4f8ef7);color:var(--tfe-acc,#4f8ef7)}
.tfe-media-divider{border:none;border-top:1px solid var(--tfe-bdr,#2d2d2d);margin:12px 0}
.tfe-media-close{background:none;border:none;color:var(--tfe-mut,#888);font-size:18px;cursor:pointer;padding:0;line-height:1}
.tfe-preview-card{display:block;border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:8px;overflow:hidden;margin:6px 0;background:var(--tfe-sur,#141414);cursor:pointer;text-decoration:none;max-width:100%}
.tfe-preview-card img{width:100%;max-height:160px;object-fit:cover;display:block}
.tfe-preview-body{padding:8px 10px}
.tfe-preview-title{font-size:13px;font-weight:700;color:var(--tfe-txt,#e0e0e0);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tfe-preview-desc{font-size:11px;color:var(--tfe-mut,#888);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.tfe-preview-domain{font-size:11px;color:var(--tfe-acc,#4f8ef7);margin-top:4px}
.tfe-url-wrap{display:inline-flex;align-items:center;gap:4px}
.tfe-preview-btn{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:4px;font-size:11px;cursor:pointer;padding:1px 5px;color:var(--tfe-mut,#888);flex-shrink:0}
.tfe-save-bar{display:flex;justify-content:flex-end;padding:8px 0 0}
.tfe-save-btn{background:var(--tfe-acc,#4f8ef7);border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:700;padding:10px 24px;cursor:pointer}
.tfe-save-btn:active{opacity:.85}
/* Light mode overrides */
.tfe-light .tfe-editor,.tfe-light .tfe-btn{background:#f5f5f5;color:#111;border-color:#ddd}
.tfe-light .tfe-preview-card{background:#fff;border-color:#ddd}
.tfe-light .tfe-preview-title{color:#111}
.tfe-light .tfe-size{color:#999}
`;

  let _cssInjected = false;
  function _injectCSS() {
    if(_cssInjected) return;
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    _cssInjected = true;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ── Main class ─────────────────────────────────────────────────────────────
  function TinyEditor(opts) {
    this.opts = Object.assign({}, DEFAULTS, opts);
    this._urlTimer = null;
    this._init();
    // Auto-detect URLs in initial value
    if(this.opts.value) {
      setTimeout(()=>this._detectUrls(), 100);
    }
  }

  TinyEditor.prototype._init = function () {
    _injectCSS();

    // Resolve target
    const target = typeof this.opts.target === 'string'
      ? document.querySelector(this.opts.target)
      : this.opts.target;
    if (!target) throw new Error('TinyEditor: target not found: ' + this.opts.target);

    // Detect dark/light
    const isDark = this.opts.darkMode === 'dark' ||
      (this.opts.darkMode === 'auto' &&
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Build wrapper
    const wrap = document.createElement('div');
    wrap.className = 'tfe-wrap' + (isDark ? '' : ' tfe-light');
    wrap.style.cssText = 'width:100%';

    // ── Toolbar ──────────────────────────────────────────────────────────────
    if (this.opts.showToolbar) {
      const tb = document.createElement('div');
      tb.className = 'tfe-toolbar';
      const LABELS = {
        bold:       '<b>B</b>',
        italic:     '<i>I</i>',
        heading:    'H',
        link:       '🔗',
        image:      '📎',
        importMd:   '📄',
        importHtml: '🌐',
        indent:     '→',
        outdent:    '←',
      };
      const TITLES = {
        bold:'Bold',italic:'Italic',heading:'Heading',
        link:'Insert link',image:'Insert media (image/video/embed)',
        importMd:'Import .md file',importHtml:'Import HTML file (no JS)',
        indent:'Indent (Tab)',outdent:'Outdent (Shift+Tab)',
      };
      this.opts.toolbar.forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'tfe-btn';
        btn.type = 'button';
        btn.innerHTML = LABELS[name] || name;
        btn.title = TITLES[name] || name;
        btn.addEventListener('click', () => this._tbAction(name));
        tb.appendChild(btn);
      });
      wrap.appendChild(tb);
    }

    // ── Size indicator ───────────────────────────────────────────────────────
    const sizeEl = document.createElement('div');
    sizeEl.className = 'tfe-size';
    sizeEl.textContent = '0 KB / ' + Math.round(this.opts.maxSize / 1024) + ' KB';
    wrap.appendChild(sizeEl);
    this._sizeEl = sizeEl;

    // ── Editor ───────────────────────────────────────────────────────────────
    const ed = document.createElement('div');
    ed.className = 'tfe-editor';
    ed.contentEditable = 'true';
    ed.spellcheck = true;
    ed.dataset.placeholder = this.opts.placeholder;
    ed.innerHTML = this.opts.value || '';
    // Restore contentEditable=false on existing preview cards
    ed.querySelectorAll('.tfe-preview-card').forEach(c => {
      c.contentEditable = 'false';
    });
    ed.addEventListener('input', () => this._onInput());
    ed.addEventListener('paste', (e) => this._onPaste(e));
    ed.addEventListener('keydown', (e) => this._onKeyDown(e));
    wrap.appendChild(ed);
    this._ed = ed;

    // ── Hidden file inputs ───────────────────────────────────────────────────
    ['img','vid','md','html'].forEach(type => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.style.display = 'none';
      inp.accept = type === 'img' ? 'image/*' : type === 'vid' ? 'video/*' : type === 'md' ? '.md,.txt' : '.html,.htm';
      inp.addEventListener('change', (e) => this._fileChosen(type, e));
      wrap.appendChild(inp);
      this['_file_' + type] = inp;  // _file_img, _file_vid, _file_md, _file_html
    });

    // ── Save button ──────────────────────────────────────────────────────────
    if (this.opts.showSaveButton && typeof this.opts.onSave === 'function') {
      const bar = document.createElement('div');
      bar.className = 'tfe-save-bar';
      const btn = document.createElement('button');
      btn.className = 'tfe-save-btn';
      btn.type = 'button';
      btn.textContent = '💾 Save';
      btn.addEventListener('click', () => this._save());
      bar.appendChild(btn);
      wrap.appendChild(bar);
    }

    target.innerHTML = '';
    target.appendChild(wrap);
    this._updateSize();
  };

  // ── Toolbar actions ────────────────────────────────────────────────────────
  TinyEditor.prototype._tbAction = function (name) {
    this._ed.focus();
    switch (name) {
      case 'bold':       document.execCommand('bold', false, null); break;
      case 'italic':     document.execCommand('italic', false, null); break;
      case 'heading': {
        const node = window.getSelection()?.anchorNode?.parentElement;
        const block = node?.closest('h2,p,div');
        if (block?.tagName === 'H2') {
          const p = document.createElement('p');
          p.innerHTML = block.innerHTML;
          block.replaceWith(p);
        } else {
          document.execCommand('formatBlock', false, 'h2');
        }
        break;
      }
      case 'link':       this._insertLink(); break;
      case 'image':      this._openMediaModal(); break;
      case 'importMd':   this._file_md.click(); break;
      case 'importHtml': this._file_html.click(); break;
      case 'indent':     this._indent(true); break;
      case 'outdent':    this._indent(false); break;
    }
    this._updateSize();
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  TinyEditor.prototype._onKeyDown = function (e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); this._tbAction('bold'); }
      if (e.key === 'i') { e.preventDefault(); this._tbAction('italic'); }
      if (e.key === 's') { e.preventDefault(); this._save(); }
    }
    // Tab = indent, Shift+Tab = outdent (prevents focus leaving editor)
    if (e.key === 'Tab') {
      e.preventDefault();
      this._indent(!e.shiftKey);
    }
    // Live markdown shortcuts
    this._checkMarkdownShortcut(e);
  };

  // ── Indent / Outdent ──────────────────────────────────────────────────────────
  TinyEditor.prototype._indent = function (isIndent) {
    this._ed.focus();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const block = (container.nodeType === 1 ? container : container.parentElement)
      .closest('li,p,div,h1,h2,h3,blockquote') || container.parentElement;

    if (!block || !this._ed.contains(block)) {
      // No block found — insert spaces for plain text
      if (isIndent) document.execCommand('insertText', false, '    ');
      return;
    }

    // Get current indent level from margin-left or padding-left
    const style = window.getComputedStyle(block);
    const currentML = parseInt(block.style.marginLeft) || 0;
    const STEP = 24; // px per indent level
    const newML = isIndent
      ? currentML + STEP
      : Math.max(0, currentML - STEP);

    block.style.marginLeft = newML > 0 ? newML + 'px' : '';
    this._updateSize();
  };

  // ── Input handler ──────────────────────────────────────────────────────────
  TinyEditor.prototype._onInput = function () {
    this._updateSize();
    if (typeof this.opts.onChange === 'function') {
      this.opts.onChange(this._ed.innerHTML);
    }
    // Always detect URLs for link rendering (preview button gated by previewMode)
    clearTimeout(this._urlTimer);
    this._urlTimer = setTimeout(() => this._detectUrls(), 800);
  };

  // ── Size indicator ─────────────────────────────────────────────────────────
  TinyEditor.prototype._updateSize = function () {
    const bytes = new Blob([this._ed.innerHTML]).size;
    const kb = (bytes / 1024).toFixed(1);
    const maxKb = Math.round(this.opts.maxSize / 1024);
    this._sizeEl.textContent = kb + ' KB / ' + maxKb + ' KB';
    this._sizeEl.style.color =
      bytes > this.opts.maxSize * 0.9 ? '#e24b4a' :
      bytes > this.opts.maxSize * 0.7 ? '#f7c94f' : '';
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  TinyEditor.prototype._save = function () {
    const html = this._ed.innerHTML;
    const size = new Blob([html]).size;
    if (size > this.opts.maxSize) {
      alert('Note too large. Max size: ' + Math.round(this.opts.maxSize / 1024) + 'KB');
      return;
    }
    if (typeof this.opts.onSave === 'function') {
      this.opts.onSave(html);
    }
  };

  // ── Get / Set value ────────────────────────────────────────────────────────
  TinyEditor.prototype.getValue = function () {
    return this._ed.innerHTML;
  };

  TinyEditor.prototype.setValue = function (html) {
    this._ed.innerHTML = html || '';
    this._updateSize();
  };

  TinyEditor.prototype.focus = function () {
    this._ed.focus();
  };

  // ── Live Markdown Shortcuts ──────────────────────────────────────────────────
  // Fires on keydown — checks if current line matches a markdown pattern
  // and converts it to HTML inline (like Notion/Typora)
  TinyEditor.prototype._checkMarkdownShortcut = function (e) {
    // Only trigger on Space, Enter, or specific chars
    if (e.key !== ' ' && e.key !== 'Enter') return;

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const node  = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    if (!this._ed.contains(node)) return;

    const text = node.textContent;
    const pos  = range.startOffset;
    const line = text.slice(0, pos); // text before cursor

    // ── Block-level patterns (triggered by Space after marker) ──────────────
    if (e.key === ' ') {
      // # Heading 1
      if (line === '#') {
        e.preventDefault();
        this._replaceLineWith(node, '<h1><br></h1>'); return;
      }
      // ## Heading 2
      if (line === '##') {
        e.preventDefault();
        this._replaceLineWith(node, '<h2><br></h2>'); return;
      }
      // ### Heading 3
      if (line === '###') {
        e.preventDefault();
        this._replaceLineWith(node, '<h3><br></h3>'); return;
      }
      // - or * → bullet list item
      if (line === '-' || line === '*') {
        e.preventDefault();
        this._replaceLineWith(node, '<ul><li><br></li></ul>', true); return;
      }
      // > → blockquote
      if (line === '>') {
        e.preventDefault();
        this._replaceLineWith(node, '<blockquote style="border-left:3px solid var(--tfe-acc,#4f8ef7);padding:4px 12px;margin:4px 0;color:var(--tfe-mut,#888)"><br></blockquote>'); return;
      }
    }

    // ── Inline patterns (triggered by closing char) ───────────────────────
    // **bold** → <strong>bold</strong>
    const boldM = line.match(/\*\*(.+)\*\*$/);
    if (boldM && e.key === ' ') {
      e.preventDefault();
      this._replaceInlinePattern(node, range, /\*\*(.+)\*\*$/, boldM[1], 'strong');
      return;
    }

    // *italic* → <em>italic</em>
    const italicM = line.match(/(?<!\*)\*([^*]+)\*$/);
    if (italicM && e.key === ' ') {
      e.preventDefault();
      this._replaceInlinePattern(node, range, /(?<!\*)\*([^*]+)\*$/, italicM[1], 'em');
      return;
    }

    // _italic_ → <em>italic</em>
    const italicM2 = line.match(/_([^_]+)_$/);
    if (italicM2 && e.key === ' ') {
      e.preventDefault();
      this._replaceInlinePattern(node, range, /_([^_]+)_$/, italicM2[1], 'em');
      return;
    }

    // `code` → <code>code</code>
    const codeM = line.match(/`([^`]+)`$/);
    if (codeM && e.key === ' ') {
      e.preventDefault();
      this._replaceInlinePattern(node, range, /`([^`]+)`$/, codeM[1], 'code');
      return;
    }

    // --- → <hr> (on Enter)
    if (e.key === 'Enter' && (line.trim() === '---' || line.trim() === '***')) {
      e.preventDefault();
      const block = node.parentElement?.closest('p,div,h1,h2,h3') || node.parentElement;
      const hr = document.createElement('hr');
      const p  = document.createElement('p');
      p.innerHTML = '<br>';
      block.replaceWith(hr, p);
      // Move cursor to new p
      const r = document.createRange();
      r.setStart(p, 0); r.collapse(true);
      sel.removeAllRanges(); sel.addRange(r);
      this._updateSize();
      return;
    }
  };

  TinyEditor.prototype._replaceLineWith = function (textNode, html, focusFirst) {
    const block = textNode.parentElement?.closest('p,div,h1,h2,h3,li') || textNode.parentElement;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const newEl = tmp.firstChild;
    block.replaceWith(newEl);
    // Move cursor inside new element
    const target = focusFirst ? newEl.querySelector('li') || newEl : newEl;
    const r = document.createRange();
    r.setStart(target, 0); r.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
    this._updateSize();
  };

  TinyEditor.prototype._replaceInlinePattern = function (textNode, range, pattern, innerText, tag) {
    const text = textNode.textContent;
    const pos  = range.startOffset;
    const before = text.slice(0, pos);
    const after  = text.slice(pos);
    const match  = before.match(pattern);
    if (!match) return;

    const matchStart = before.lastIndexOf(match[0]);
    const beforeMatch = before.slice(0, matchStart);

    const el = document.createElement(tag);
    if (tag === 'code') {
      el.style.cssText = 'background:var(--tfe-sur2,#1e1e1e);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px';
    }
    el.textContent = innerText;

    const frag = document.createDocumentFragment();
    if (beforeMatch) frag.appendChild(document.createTextNode(beforeMatch));
    frag.appendChild(el);
    const space = document.createTextNode(' '); // non-breaking space after
    frag.appendChild(space);
    if (after) frag.appendChild(document.createTextNode(after));

    textNode.parentNode.replaceChild(frag, textNode);

    // Move cursor after the inserted element
    const r = document.createRange();
    r.setStartAfter(space); r.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
    this._updateSize();
  };

  // ── Auto URL detection ─────────────────────────────────────────────────────
  TinyEditor.prototype._detectUrls = function () {
    const ed = this._ed;
    const urlRe = /https?:\/\/[^\s<>"]+/g;
    const walker = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.tagName !== 'A' &&
          !node.parentElement.classList.contains('tfe-url-wrap') &&
          urlRe.test(node.textContent)) {
        nodes.push(node);
      }
      urlRe.lastIndex = 0;
    }
    const self = this;
    nodes.forEach(n => {
      const frag = document.createDocumentFragment();
      let last = 0, m;
      urlRe.lastIndex = 0;
      while ((m = urlRe.exec(n.textContent))) {
        if (m.index > last) frag.appendChild(document.createTextNode(n.textContent.slice(last, m.index)));
        const url = m[0];
        const wrap = document.createElement('span');
        wrap.className = 'tfe-url-wrap';
        const a = document.createElement('a');
        a.href = url; a.target = '_blank';
        a.textContent = url;
        const pvBtn = document.createElement('button');
        pvBtn.className = 'tfe-preview-btn';
        pvBtn.textContent = '👁';
        pvBtn.title = 'Show inline preview';
        pvBtn.type = 'button';
        pvBtn.dataset.url = url;
        pvBtn.addEventListener('click', function (e) {
          e.preventDefault();
          self._fetchPreview(url, pvBtn);
        });
        wrap.appendChild(a);
        // Only show preview button if linkPreviewUrl is configured
        if (self.opts.previewMode && self.opts.previewMode !== 'none') wrap.appendChild(pvBtn);
        frag.appendChild(wrap);
        last = m.index + url.length;
      }
      if (last < n.textContent.length) frag.appendChild(document.createTextNode(n.textContent.slice(last)));
      n.parentNode.replaceChild(frag, n);
    });
  };

  // ── Link preview fetch ─────────────────────────────────────────────────────
  // ── Link preview — configurable modes ────────────────────────────────────
  TinyEditor.prototype._fetchPreview = function (url, btn) {
    const mode = this.opts.previewMode || 'none';
    if (mode === 'none') return;
    btn.textContent = '⏳';
    btn.disabled = true;
    const self = this;
    this._getPreviewData(url, mode)
      .then(function(data) { self._renderPreviewCard(data, url, btn); })
      .catch(function() { btn.textContent = '👁'; btn.disabled = false; });
  };

  TinyEditor.prototype._getPreviewData = function (url, mode) {
    const self = this;

    // domain-only: zero network requests
    if (mode === 'domain-only') {
      return Promise.resolve(self._domainOnlyData(url));
    }

    // backend: use your own API
    if (mode === 'backend' && this.opts.linkPreviewUrl) {
      return fetch(this.opts.linkPreviewUrl + '?url=' + encodeURIComponent(url))
        .then(function(r) { return r.json(); });
    }

    // smart: YouTube/Vimeo/GitHub direct + cors-proxy fallback
    if (mode === 'smart') {
      // YouTube — thumbnail direct, no API key
      var ytM = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      if (ytM) {
        return Promise.resolve({
          title: 'YouTube Video', description: '',
          image: 'https://img.youtube.com/vi/' + ytM[1] + '/hqdefault.jpg',
          domain: 'youtube.com', site_name: 'YouTube', url: url,
        });
      }

      // Vimeo oEmbed — free, no API key
      var vmM = url.match(/vimeo\.com\/(\d+)/);
      if (vmM) {
        return fetch('https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(url))
          .then(function(r) { return r.json(); })
          .then(function(d) {
            return { title: d.title||'Vimeo Video', description: d.description||'',
              image: d.thumbnail_url||'', domain: 'vimeo.com', site_name: 'Vimeo', url: url };
          })
          .catch(function() { return self._domainOnlyData(url); });
      }

      // GitHub public repo — free API
      var ghM = url.match(/github\.com\/([\w-]+)\/([\w.-]+)/);
      if (ghM) {
        return fetch('https://api.github.com/repos/' + ghM[1] + '/' + ghM[2])
          .then(function(r) { return r.json(); })
          .then(function(d) {
            return { title: d.full_name||ghM[1]+'/'+ghM[2], description: d.description||'',
              image: (d.owner && d.owner.avatar_url)||'', domain: 'github.com', site_name: 'GitHub', url: url };
          })
          .catch(function() { return self._domainOnlyData(url); });
      }

      // Try own backend if configured
      if (this.opts.linkPreviewUrl) {
        return fetch(this.opts.linkPreviewUrl + '?url=' + encodeURIComponent(url))
          .then(function(r) { return r.json(); })
          .catch(function() { return self._domainOnlyData(url); });
      }

      // Last resort: corsproxy (free public proxy)
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = controller ? setTimeout(function() { controller.abort(); }, 5000) : null;
      return fetch('https://corsproxy.io/?' + encodeURIComponent(url),
          controller ? {signal: controller.signal} : {})
        .then(function(r) { if(timer) clearTimeout(timer); return r.text(); })
        .then(function(html) { return self._parseMetaTags(html, url); })
        .catch(function() { return self._domainOnlyData(url); });
    }

    return Promise.resolve(self._domainOnlyData(url));
  };

  TinyEditor.prototype._parseMetaTags = function (html, url) {
    var getMeta = function(prop) {
      var patterns = [
        new RegExp('<meta[^>]+(?:property|name)=["\']' + prop.replace(/:/g,'[:]') + '["\'][^>]+content=["\']([^"\']+)["\']','i'),
        new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + prop.replace(/:/g,'[:]') + '["\']','i'),
      ];
      for(var i=0;i<patterns.length;i++){var m=html.match(patterns[i]);if(m)return m[1].trim();}
      return '';
    };
    var titleM = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    var domain = this._extractDomain(url);
    return {
      title:       getMeta('og:title')||getMeta('twitter:title')||(titleM?titleM[1].trim():domain),
      description: getMeta('og:description')||getMeta('description')||'',
      image:       getMeta('og:image')||getMeta('twitter:image')||'',
      domain:      domain, site_name: getMeta('og:site_name')||domain, url: url,
    };
  };

  TinyEditor.prototype._domainOnlyData = function (url) {
    var domain = this._extractDomain(url);
    return { title: domain, description: '', image: '', domain: domain, site_name: domain, url: url };
  };

  TinyEditor.prototype._extractDomain = function (url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch(e) { return url; }
  };

  TinyEditor.prototype._renderPreviewCard = function (data, url, btn) {
    var self = this;
    var card = document.createElement('div');
    card.className = 'tfe-preview-card';
    card.contentEditable = 'false';
    if (data.image) {
      var img = document.createElement('img');
      img.src = data.image;
      img.onerror = function() { this.style.display='none'; };
      card.appendChild(img);
    }
    var body = document.createElement('div');
    body.className = 'tfe-preview-body';
    body.innerHTML =
      '<div class="tfe-preview-title">' + _esc(data.title||url) + '</div>' +
      (data.description ? '<div class="tfe-preview-desc">' + _esc(data.description) + '</div>' : '') +
      '<div class="tfe-preview-domain">' + _esc(data.domain||'') + ' ↗</div>';
    card.appendChild(body);
    card.addEventListener('click', function() { window.open(url, '_blank'); });
    var span = btn.closest('.tfe-url-wrap') || btn.parentElement;
    span.replaceWith(card);
    self._updateSize();
  };

  // ── Paste handler ──────────────────────────────────────────────────────────
  TinyEditor.prototype._onPaste = function (e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const self = this;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file.size > self.opts.maxImageSize) {
          alert('Image too large. Max: ' + Math.round(self.opts.maxImageSize / 1024) + 'KB');
          return;
        }
        const reader = new FileReader();
        reader.onload = function (ev) {
          document.execCommand('insertHTML', false,
            '<img src="' + ev.target.result + '" style="max-width:100%;border-radius:4px;margin:4px 0">');
          self._updateSize();
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  // ── Media Modal ──────────────────────────────────────────────────────────────
  TinyEditor.prototype._openMediaModal = function () {
    var self = this;
    var basePath = this.opts.mediaBasePath || '';
    var existing = document.getElementById('tfe-media-modal');
    if (existing) existing.remove();
    var modal = document.createElement('div');
    modal.id = 'tfe-media-modal';
    modal.className = 'tfe-media-modal';
    var pathSection = basePath ? [
      '<hr class="tfe-media-divider">',
      '<div class="tfe-media-section">',
        '<div class="tfe-media-label">&#128193; FROM PATH (' + _esc(basePath) + ')</div>',
        '<div class="tfe-media-row">',
          '<input class="tfe-media-input" id="tfe-mc-path" placeholder="photo.jpg or video.mp4">',
          '<button class="tfe-media-btn" id="tfe-mc-path-insert">Insert</button>',
        '</div>',
      '</div>',
    ].join('') : '';
    modal.innerHTML = '<div class="tfe-media-box">'
      + '<div class="tfe-media-title"><span>&#128206; Insert Media</span>'
      + '<button class="tfe-media-close" id="tfe-mc-close">&#10005;</button></div>'
      + '<div class="tfe-media-section">'
      + '<div class="tfe-media-label">&#128279; URL &mdash; IMAGE, VIDEO OR EMBED</div>'
      + '<div class="tfe-media-row">'
      + '<input class="tfe-media-input" id="tfe-mc-url" placeholder="youtube.com/watch?v= or direct image/video URL" autocomplete="off">'
      + '<button class="tfe-media-btn" id="tfe-mc-embed">Insert</button>'
      + '</div>'
      + '<div style="font-size:10px;color:var(--tfe-mut,#888);margin-top:4px">'
      + 'YouTube &middot; Vimeo &middot; Facebook &middot; Instagram &middot; Twitter/X &middot; .jpg .png .mp4 .webm'
      + '</div></div>'
      + '<hr class="tfe-media-divider">'
      + '<div class="tfe-media-section"><div class="tfe-media-label">&#128193; UPLOAD FILE</div>'
      + '<div class="tfe-media-row">'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-img-upload">&#128444; Image</button>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-vid-upload">&#127916; Video</button>'
      + '</div></div>'
      + pathSection + '</div>';
    document.body.appendChild(modal);
    var close = function() { modal.remove(); };
    document.getElementById('tfe-mc-close').onclick = close;
    modal.onclick = function(e) { if (e.target === modal) close(); };
    document.getElementById('tfe-mc-embed').onclick = function() {
      var url = (document.getElementById('tfe-mc-url').value || '').trim();
      if (!url) return;
      self._insertMediaByUrl(url); close();
    };
    document.getElementById('tfe-mc-url').onkeydown = function(e) {
      if (e.key === 'Enter') document.getElementById('tfe-mc-embed').click();
    };
    document.getElementById('tfe-mc-img-upload').onclick = function() { close(); self._file_img.click(); };
    document.getElementById('tfe-mc-vid-upload').onclick = function() { close(); self._file_vid.click(); };
    if (basePath && document.getElementById('tfe-mc-path-insert')) {
      document.getElementById('tfe-mc-path-insert').onclick = function() {
        var p = (document.getElementById('tfe-mc-path').value || '').trim();
        if (!p) return;
        var full = basePath.replace(/\/+$/, '') + '/' + p.replace(/^\/+/, '');
        self._insertMediaByUrl(full); close();
      };
    }
    setTimeout(function() {
      var inp = document.getElementById('tfe-mc-url');
      if (inp) inp.focus();
    }, 50);
  };

  TinyEditor.prototype._insertMediaByUrl = function (url) {
    this._ed.focus();
    // Insert media + a paragraph after so cursor stays editable
    var html = this._buildMediaHtml(url);
    document.execCommand('insertHTML', false, html + '<p><br></p>');
    this._updateSize();
  };

  TinyEditor.prototype._buildMediaHtml = function (url) {
    var u = url.trim();
    // YouTube
    var ytM = u.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]+)/);
    if (ytM) return '<div contenteditable="false" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:6px 0">'
      + '<iframe src="https://www.youtube.com/embed/' + ytM[1] + '?rel=0" '
      + 'style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:8px" '
      + 'allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>';
    // Vimeo
    var vmM = u.match(/vimeo\.com\/(\d+)/);
    if (vmM) return '<div contenteditable="false" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:6px 0">'
      + '<iframe src="https://player.vimeo.com/video/' + vmM[1] + '?badge=0&autopause=0" '
      + 'style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:8px" '
      + 'allow="autoplay;fullscreen;picture-in-picture" allowfullscreen></iframe></div>';
    // Facebook video
    var fbM = u.match(/facebook\.com\/.*\/videos\/(\d+)/i) || u.match(/fb\.watch\/([\w-]+)/);
    if (fbM) return '<div contenteditable="false" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:6px 0">'
      + '<iframe src="https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(u) + '&show_text=false" '
      + 'style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:8px" '
      + 'allow="autoplay;clipboard-write;encrypted-media;picture-in-picture;web-share" allowfullscreen></iframe></div>';
    // Instagram post/reel
    var igM = u.match(/instagram\.com\/(p|reel|tv)\/([\w-]+)/);
    if (igM) return '<div contenteditable="false" style="border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:8px;margin:6px 0;overflow:hidden">'
      + '<iframe src="https://www.instagram.com/' + igM[1] + '/' + igM[2] + '/embed/" '
      + 'style="width:100%;min-height:400px;border:none" loading="lazy" scrolling="no" allowtransparency="true"></iframe></div>';
    // Twitter / X
    var twM = u.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/);
    if (twM) return '<div contenteditable="false" style="border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:8px;margin:6px 0;overflow:hidden">'
      + '<iframe src="https://platform.twitter.com/embed/Tweet.html?id=' + twM[1] + '" '
      + 'style="width:100%;min-height:250px;border:none" loading="lazy"></iframe></div>';
    // Direct video file
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(u)) return '<video controls contenteditable="false" '
      + 'style="max-width:100%;border-radius:6px;margin:4px 0;display:block;background:#000" preload="metadata">'
      + '<source src="' + _esc(u) + '">Your browser does not support video.</video>';
    // Direct image file
    if (/\.(jpe?g|png|gif|webp|svg|bmp)(\?|$)/i.test(u)) return '<img src="' + _esc(u)
      + '" style="max-width:100%;border-radius:4px;margin:4px 0;display:block">';
    // Generic link fallback
    return '<a href="' + _esc(u) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(u) + '</a>';
  };

  // ── Insert link ────────────────────────────────────────────────────────────
  TinyEditor.prototype._insertLink = function () {
    const url  = prompt('Enter URL:');
    if (!url) return;
    const text = prompt('Link text (leave blank to use URL):') || url;
    this._ed.focus();
    document.execCommand('insertHTML', false,
      '<a href="' + _esc(url) + '" target="_blank">' + _esc(text) + '</a> ');
    // Trigger URL detection to add preview button
    clearTimeout(this._urlTimer);
    this._urlTimer = setTimeout(() => this._detectUrls(), 100);
    this._updateSize();
  };

  // ── File chosen handler ────────────────────────────────────────────────────
  TinyEditor.prototype._fileChosen = function (type, e) {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = type === 'img' ? this.opts.maxImageSize : type === 'vid' ? this.opts.maxVideoSize : this.opts.maxSize;
    if (file.size > maxSize) {
      alert('File too large. Max: ' + Math.round(maxSize / 1024) + 'KB');
      e.target.value = '';
      return;
    }
    const self = this;
    const reader = new FileReader();
    if (type === 'img') {
      reader.onload = function (ev) {
        self._ed.focus();
        document.execCommand('insertHTML', false,
          '<img src="' + ev.target.result + '" style="max-width:100%;border-radius:4px;margin:4px 0">');
        self._updateSize();
      };
      reader.readAsDataURL(file);
    } else if (type === 'vid') {
      reader.onload = function (ev) {
        self._ed.focus();
        document.execCommand('insertHTML', false,
          '<video controls contenteditable="false" style="max-width:100%;border-radius:6px;margin:4px 0;display:block;background:#000" preload="metadata">'
          + '<source src="' + ev.target.result + '" type="' + file.type + '">'
          + 'Your browser does not support video.</video>');
        self._updateSize();
      };
      reader.readAsDataURL(file);
    } else if (type === 'md') {
      reader.onload = function (ev) {
        self._insertHtmlAtCursor(self._mdToHtml(ev.target.result));
        self._updateSize();
      };
      reader.readAsText(file);
    } else if (type === 'html') {
      reader.onload = function (ev) {
        self._insertHtmlAtCursor(self._sanitizeHtml(ev.target.result));
        self._updateSize();
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // ── Insert HTML at cursor ──────────────────────────────────────────────────
  TinyEditor.prototype._insertHtmlAtCursor = function (html) {
    this._ed.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      if (this._ed.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const div = document.createElement('div');
        div.innerHTML = html;
        const frag = document.createDocumentFragment();
        Array.from(div.childNodes).forEach(n => frag.appendChild(n));
        range.insertNode(frag);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
    }
    this._ed.innerHTML += html;
  };

  // ── Markdown → HTML ────────────────────────────────────────────────────────
  TinyEditor.prototype._mdToHtml = function (md) {
    return md
      .replace(/^### (.+)$/gm,  '<h3>$1</h3>')
      .replace(/^## (.+)$/gm,   '<h2>$1</h2>')
      .replace(/^# (.+)$/gm,    '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,    '<em>$1</em>')
      .replace(/_(.+?)_/g,      '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" style="max-width:100%;border-radius:4px">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank">$1</a>')
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[^<]*<\/li>)+/g, s => '<ul>' + s + '</ul>')
      .replace(/^---$/gm,       '<hr>')
      .split('\n\n').map(p => p.startsWith('<') ? p : '<p>' + p.replace(/\n/g,'<br>') + '</p>')
      .join('');
  };

  // ── HTML sanitiser (removes scripts/handlers) ──────────────────────────────
  TinyEditor.prototype._sanitizeHtml = function (raw) {
    const bodyM = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let html = bodyM ? bodyM[1] : raw;
    html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
    html = html.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '');
    html = html.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');
    return html;
  };

  return TinyEditor;
}));
