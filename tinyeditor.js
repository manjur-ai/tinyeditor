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
    // Media modal section visibility
    showMediaUrl:    true,             // Show URL / embed section
    showMediaUpload: true,             // Show upload file section
    showMediaFiles:  true,             // Show "My Files" picker section
    // Server-side upload/list endpoints
    uploadUrl:       null,             // POST endpoint e.g. '/api/upload'
    listUrl:         null,             // GET endpoint e.g. '/api/uploads'
    deleteUrl:       null,             // DELETE endpoint e.g. '/api/uploads'
    darkMode:       'auto',            // 'auto' | 'dark' | 'light'
    linkPreviewUrl: null,              // URL of your link-preview API endpoint
    //   GET {linkPreviewUrl}?url=<encoded>
    //   returns { title, description, image, domain }
    onChange:       null,              // fn(html) — called on every change
    onSave:         null,              // fn(html) — called when Save is clicked
    showSaveButton: true,
    showToolbar:    true,
    toolbar: ['bold','italic','heading','link','image','importMd','importHtml','indent','outdent','markStart','deleteSelection'],
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
.tfe-editor ul{padding-left:20px;margin:4px 0;list-style:disc}
.tfe-editor ol{padding-left:20px;margin:4px 0;list-style:decimal}
.tfe-editor li{margin:2px 0;display:list-item}
.tfe-editor a{color:var(--tfe-acc,#4f8ef7);text-decoration:underline}
.tfe-editor img{max-width:100%;border-radius:4px;margin:4px 0;display:block}
.tfe-editor hr{border:none;border-top:1px solid var(--tfe-bdr,#2d2d2d);margin:8px 0}
.tfe-editor code{background:var(--tfe-sur2,#1e1e1e);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px;color:var(--tfe-acc,#4f8ef7)}
.tfe-editor pre{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;padding:12px;overflow-x:auto;margin:8px 0;white-space:pre;font-family:monospace}
.tfe-editor pre code{background:none;padding:0;border-radius:0;white-space:pre}
.tfe-editor blockquote{border-left:3px solid var(--tfe-acc,#4f8ef7);padding:4px 12px;margin:4px 0;color:var(--tfe-mut,#888)}
.tfe-editor video{max-width:100%;border-radius:6px;margin:4px 0;display:block;background:#000}
.tfe-editor iframe{max-width:100%;border-radius:6px;margin:4px 0;display:block;border:none}
.tfe-media-modal{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center}
.tfe-media-box{background:var(--tfe-sur,#141414);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:14px;padding:16px;width:94vw;max-width:600px;display:flex;flex-direction:column;gap:10px}
.tfe-media-title{font-size:15px;font-weight:700;color:var(--tfe-txt,#e0e0e0);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}
.tfe-media-section{margin-bottom:0}
.tfe-media-card{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:10px;padding:14px 16px}
.tfe-media-card--url{border-left:3px solid var(--tfe-acc,#4f8ef7)}
.tfe-media-card--upload{border-left:3px solid #4caf50}
.tfe-media-card--path{border-left:3px solid #f7c94f}
.tfe-media-label{font-size:13px;font-weight:700;color:var(--tfe-mut,#888);letter-spacing:.04em;margin-bottom:8px}
.tfe-media-row{display:flex;gap:6px}
.tfe-media-input{flex:1;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:8px;color:var(--tfe-txt,#e0e0e0);padding:10px 12px;font-size:15px;outline:none}
.tfe-media-input:focus{border-color:var(--tfe-acc,#4f8ef7)}
.tfe-media-btn{background:var(--tfe-acc,#4f8ef7);border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:700;padding:10px 16px;cursor:pointer;white-space:nowrap}
.tfe-media-btn-sec{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:8px;color:var(--tfe-txt,#e0e0e0);font-size:14px;font-weight:600;padding:10px 16px;cursor:pointer;flex:1}
.tfe-media-btn-sec:hover{border-color:var(--tfe-acc,#4f8ef7);color:var(--tfe-acc,#4f8ef7)}
.tfe-media-radio{display:flex;gap:0;margin-bottom:4px;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:10px;padding:4px;overflow:hidden}
.tfe-media-radio label{display:flex;align-items:center;justify-content:center;gap:7px;font-size:14px;font-weight:600;color:var(--tfe-mut,#888);cursor:pointer;padding:9px 0;border-radius:7px;transition:all .2s;flex:1}
.tfe-media-radio label:hover{color:var(--tfe-txt,#e0e0e0)}
.tfe-media-radio input[type=radio]{display:none}
.tfe-media-radio label.tfe-radio-selected{background:var(--tfe-acc,#4f8ef7);color:#fff;box-shadow:0 2px 8px rgba(79,142,247,.35)}
.tfe-media-title{font-size:15px;font-weight:700;color:var(--tfe-txt,#e0e0e0);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}
.tfe-media-divider{display:none}
.tfe-media-close{background:none;border:none;color:var(--tfe-mut,#888);font-size:18px;cursor:pointer;padding:0;line-height:1}
.tfe-media-files{display:flex;flex-direction:column;gap:4px;max-height:220px;overflow-y:auto;margin-top:8px}
.tfe-media-file-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;background:var(--tfe-sur,#141414);border:1px solid transparent;transition:all .15s}
.tfe-media-file-row:hover{border-color:var(--tfe-acc,#4f8ef7);background:rgba(79,142,247,.06)}
.tfe-media-file-row.tfe-file-selected{border-color:var(--tfe-acc,#4f8ef7);background:rgba(79,142,247,.12)}
.tfe-media-file-icon{font-size:18px;flex-shrink:0;width:24px;text-align:center}
.tfe-media-file-info{flex:1;min-width:0}
.tfe-media-file-name{font-size:13px;color:var(--tfe-txt,#e0e0e0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
.tfe-media-file-meta{font-size:11px;color:var(--tfe-mut,#888);margin-top:1px}
.tfe-media-file-del{background:none;border:none;color:var(--tfe-mut,#888);cursor:pointer;font-size:14px;padding:2px 6px;border-radius:4px;flex-shrink:0;opacity:0;transition:opacity .15s}
.tfe-media-file-row:hover .tfe-media-file-del{opacity:1}
.tfe-media-file-del:hover{color:#e24b4a;background:rgba(226,75,74,.1)}
.tfe-media-file-empty{font-size:13px;color:var(--tfe-mut,#888);text-align:center;padding:16px;border:1px dashed var(--tfe-bdr,#2d2d2d);border-radius:8px}
.tfe-media-file-insert{background:var(--tfe-acc,#4f8ef7);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:9px 18px;cursor:pointer;margin-top:10px;width:100%;opacity:.5;pointer-events:none;transition:opacity .2s}
.tfe-media-file-insert.tfe-file-insert-ready{opacity:1;pointer-events:auto}
.tfe-media-upload-progress{height:3px;background:var(--tfe-bdr,#2d2d2d);border-radius:2px;margin-top:8px;display:none}
.tfe-media-upload-progress-bar{height:100%;background:var(--tfe-acc,#4f8ef7);border-radius:2px;width:0;transition:width .3s}
.tfe-media-card--files{border-left:3px solid #9c27b0}
.tfe-raw-modal{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:12px}
.tfe-raw-box{background:var(--tfe-sur,#141414);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:12px;padding:20px;width:100%;max-width:440px;display:flex;flex-direction:column;gap:12px}
.tfe-raw-warn{background:rgba(247,201,79,.08);border:1px solid rgba(247,201,79,.3);border-radius:8px;padding:12px;font-size:13px;color:var(--tfe-txt,#e0e0e0);line-height:1.6}
.tfe-raw-warn-title{font-size:14px;font-weight:700;color:#f7c94f;margin-bottom:6px;display:flex;align-items:center;gap:6px}
.tfe-raw-confirm{display:flex;flex-direction:column;gap:6px}
.tfe-raw-confirm label{font-size:12px;color:var(--tfe-mut,#888)}
.tfe-raw-confirm input{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;color:var(--tfe-txt,#e0e0e0);padding:8px 10px;font-size:13px;outline:none;width:100%}
.tfe-raw-confirm input:focus{border-color:var(--tfe-acc,#4f8ef7)}
.tfe-raw-confirm input.tfe-raw-confirm--ok{border-color:#4caf50;background:rgba(76,175,80,.08)}
.tfe-raw-btns{display:flex;gap:8px}
.tfe-raw-btn-skip{flex:1;background:var(--tfe-acc,#4f8ef7);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:10px;cursor:pointer}
.tfe-raw-btn-ro{flex:1;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:8px;color:var(--tfe-txt,#e0e0e0);font-size:13px;font-weight:600;padding:10px;cursor:pointer}
.tfe-raw-btn-edit{flex:1;background:rgba(226,75,74,.1);border:1px solid rgba(226,75,74,.4);border-radius:8px;color:#e24b4a;font-size:13px;font-weight:700;padding:10px;cursor:pointer;opacity:.4;pointer-events:none;transition:all .2s}
.tfe-raw-btn-edit.tfe-raw-btn-edit--ready{opacity:1;pointer-events:auto;background:rgba(226,75,74,.15)}
.tfe-raw-btn-edit.tfe-raw-btn-edit--ready:hover{background:#e24b4a;color:#fff}
.tfe-raw-textarea{width:100%;min-height:300px;max-height:55vh;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;color:var(--tfe-txt,#e0e0e0);padding:12px;font-size:12px;font-family:monospace;line-height:1.6;outline:none;resize:vertical;tab-size:2}
.tfe-raw-textarea:focus{border-color:var(--tfe-acc,#4f8ef7)}
.tfe-raw-footer{display:flex;gap:8px;justify-content:flex-end}
.tfe-raw-save{background:#4caf50;border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:9px 18px;cursor:pointer}
.tfe-raw-save:hover{background:#43a047}
.tfe-raw-cancel{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:8px;color:var(--tfe-txt,#e0e0e0);font-size:13px;padding:9px 14px;cursor:pointer}
.tfe-preview-card{display:block;border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:8px;overflow:hidden;margin:6px 0;background:var(--tfe-sur,#141414);cursor:pointer;text-decoration:none;max-width:100%}
.tfe-preview-card img{width:100%;max-height:160px;object-fit:cover;display:block}
.tfe-preview-body{padding:8px 10px}
.tfe-preview-title{font-size:13px;font-weight:700;color:var(--tfe-txt,#e0e0e0);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tfe-preview-desc{font-size:11px;color:var(--tfe-mut,#888);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.tfe-preview-domain{font-size:11px;color:var(--tfe-acc,#4f8ef7);margin-top:4px}
.tfe-url-wrap{display:inline-flex;align-items:center;gap:4px}
.tfe-preview-btn{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:4px;font-size:11px;cursor:pointer;padding:1px 5px;color:var(--tfe-mut,#888);flex-shrink:0}
.tfe-block-wrap{position:relative;margin:4px 0}
.tfe-block-wrap .tfe-del-btn{position:absolute;top:4px;left:-22px;width:18px;height:18px;background:rgba(226,75,74,.15);border:1px solid rgba(226,75,74,.4);border-radius:50%;color:#e24b4a;font-size:11px;font-weight:900;cursor:pointer;display:none;align-items:center;justify-content:center;line-height:1;z-index:10;transition:background .15s}
.tfe-block-wrap:hover .tfe-del-btn{display:flex}
.tfe-block-wrap .tfe-del-btn:hover{background:rgba(226,75,74,.35)}
.tfe-editor{padding-left:26px !important}
.tfe-line-del{position:absolute;left:-22px;top:50%;transform:translateY(-50%);width:16px;height:16px;background:rgba(226,75,74,.1);border:1px solid rgba(226,75,74,.3);border-radius:50%;color:#e24b4a;font-size:10px;font-weight:900;cursor:pointer;display:none;align-items:center;justify-content:center;line-height:1;z-index:9;transition:background .15s}
.tfe-editor p:hover>.tfe-line-del,.tfe-editor h1:hover>.tfe-line-del,.tfe-editor h2:hover>.tfe-line-del,.tfe-editor h3:hover>.tfe-line-del,.tfe-editor li:hover>.tfe-line-del,.tfe-editor blockquote:hover>.tfe-line-del{display:flex}
.tfe-line-del:hover{background:rgba(226,75,74,.35)}
.tfe-editor p,.tfe-editor h1,.tfe-editor h2,.tfe-editor h3,.tfe-editor h4,.tfe-editor li,.tfe-editor blockquote{position:relative}
#tfe-sel-del{position:fixed;z-index:99999;background:#e24b4a;border:none;border-radius:6px;color:#fff;font-size:12px;font-weight:700;padding:4px 10px;cursor:pointer;display:none;box-shadow:0 2px 8px rgba(0,0,0,.4);pointer-events:auto}
#tfe-sel-del:hover{background:#c0392b}
.tfe-btn.tfe-btn--active{background:var(--tfe-acc,#4f8ef7);color:#fff;border-color:var(--tfe-acc,#4f8ef7)}
.tfe-btn.tfe-btn--danger{background:rgba(226,75,74,.15);color:#e24b4a;border-color:rgba(226,75,74,.5)}
.tfe-btn.tfe-btn--danger:hover{background:#e24b4a;color:#fff}
.tfe-start-marker{display:inline-block;width:2px;height:1em;background:var(--tfe-acc,#4f8ef7);vertical-align:middle;border-radius:1px;margin:0 1px;animation:tfe-blink 1s infinite}
@keyframes tfe-blink{0%,100%{opacity:1}50%{opacity:.3}}
.tfe-mark-line{border-left:2px solid var(--tfe-acc,#4f8ef7);padding-left:4px;background:rgba(79,142,247,.05)}
.tfe-md-group{position:relative;border-left:2px solid rgba(79,142,247,.2);padding-left:4px;margin:4px 0}
.tfe-md-group-del{position:absolute;top:4px;left:-22px;width:18px;height:18px;background:rgba(226,75,74,.15);border:1px solid rgba(226,75,74,.4);border-radius:50%;color:#e24b4a;font-size:11px;font-weight:900;cursor:pointer;display:none;align-items:center;justify-content:center;line-height:1;z-index:10;transition:background .15s}
.tfe-md-group:hover>.tfe-md-group-del{display:flex}
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
        markStart:  '📍',
        deleteSelection: '🗑',
        rawHtml: '&lt;/&gt;',
      };
      const TITLES = {
        bold:'Bold',italic:'Italic',heading:'Heading',
        link:'Insert link',image:'Insert media (image/video/embed)',
        importMd:'Import .md file',importHtml:'Import HTML file (no JS)',
        indent:'Indent (Tab)',outdent:'Outdent (Shift+Tab)',
        markStart:'Mark selection start',
        deleteSelection:'Delete selection / marked range',
        rawHtml:'Raw HTML editor',
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
    this._wrap = wrap;
    this._startMarker = null;
    this._startMarkerBlock = null;
    this._updateSize();
    this._initSelectionDelete();
    this._addLineDelButtons();
    this._initSelectionWatcher();
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
      case 'indent':         this._indent(true); break;
      case 'outdent':        this._indent(false); break;
      case 'markStart':      this._markSelectionStart(); break;
      case 'deleteSelection':this._deleteSelection(); break;
      case 'rawHtml':        this._openRawHtmlEditor(); break;
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

  // ── Mark selection start + delete selection ─────────────────────────────────
  TinyEditor.prototype._markSelectionStart = function () {
    var self = this;
    // If already marked — clear it
    if (this._startMarker) {
      this._clearStartMarker();
      return;
    }

    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    var range = sel.getRangeAt(0).cloneRange();
    range.collapse(true); // collapse to start

    // If cursor is at start of block containing a line-del button, move past it
    var sc = range.startContainer;
    if (sc.nodeType === 1 && sc.firstChild && sc.firstChild.classList && sc.firstChild.classList.contains('tfe-line-del')) {
      range.setStart(sc, 1); // skip the button node
    }

    // Insert a visible marker span at cursor
    var marker = document.createElement('span');
    marker.className = 'tfe-start-marker';
    marker.contentEditable = 'false';
    marker.title = 'Selection start — click 🗑 to delete to cursor';
    range.insertNode(marker);

    // Highlight the line containing the marker
    var block = marker.closest('p,h1,h2,h3,h4,li,blockquote,div');
    if (block) block.classList.add('tfe-mark-line');

    this._startMarker = marker;
    this._startMarkerBlock = block;

    // Update 📍 button to show active state
    this._updateMarkerBtn(true);

    // Move cursor after the marker
    var r2 = document.createRange();
    r2.setStartAfter(marker);
    r2.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r2);
  };

  TinyEditor.prototype._clearStartMarker = function () {
    if (this._startMarker) {
      if (this._startMarkerBlock) this._startMarkerBlock.classList.remove('tfe-mark-line');
      this._startMarker.remove();
      this._startMarker = null;
      this._startMarkerBlock = null;
    }
    this._updateMarkerBtn(false);
    this._updateDeleteBtn(false);
  };

  TinyEditor.prototype._updateMarkerBtn = function (active) {
    var btn = this._wrap && this._wrap.querySelector('.tfe-btn[title*="Mark selection"]');
    if (!btn) return;
    if (active) {
      btn.classList.add('tfe-btn--active');
      btn.title = 'Clear start marker';
    } else {
      btn.classList.remove('tfe-btn--active');
      btn.title = 'Mark selection start';
    }
  };

  TinyEditor.prototype._updateDeleteBtn = function (active) {
    var btn = this._wrap && this._wrap.querySelector('.tfe-btn[title*="Delete selection"]');
    if (!btn) return;
    if (active) {
      btn.classList.add('tfe-btn--danger');
    } else {
      btn.classList.remove('tfe-btn--danger');
    }
  };

  TinyEditor.prototype._deleteSelection = function () {
    var sel = window.getSelection();

    // Case 1: Text is manually selected → delete it
    if (sel && !sel.isCollapsed && this._ed.contains(sel.anchorNode)) {
      // Check if selection spans multiple blocks
      var range = sel.getRangeAt(0);
      var startBlock = (range.startContainer.nodeType===3
        ? range.startContainer.parentElement
        : range.startContainer).closest('p,h1,h2,h3,h4,li,div,blockquote,pre');
      var endBlock = (range.endContainer.nodeType===3
        ? range.endContainer.parentElement
        : range.endContainer).closest('p,h1,h2,h3,h4,li,div,blockquote,pre');

      if (startBlock !== endBlock) {
        // Multi-block: collect and remove all blocks in range
        this._deleteBlockRange(range);
      } else {
        // Single block: just delete selected text
        range.deleteContents();
      }
      this._clearStartMarker();
      this._updateSize();
      return;
    }

    // Case 2: Start marker set → delete from marker to current cursor
    if (this._startMarker) {
      if (!sel || !sel.rangeCount) return;
      var curRange = sel.getRangeAt(0);
      var self = this;

      var delRange = document.createRange();
      try {
        delRange.setStartAfter(this._startMarker);
        delRange.setEnd(curRange.endContainer, curRange.endOffset);

        // If cursor is before marker, flip
        if (delRange.collapsed) {
          delRange.setStart(curRange.startContainer, curRange.startOffset);
          delRange.setEndBefore(this._startMarker);
        }

        if (!delRange.collapsed) {
          // Find the shared container of start and end
          var ancestor = delRange.commonAncestorContainer;
          if (ancestor.nodeType === 3) ancestor = ancestor.parentElement;

          // If both ends are in same block-level element (p, li, etc.) — simple delete
          var startEl = (delRange.startContainer.nodeType===3
            ? delRange.startContainer.parentElement : delRange.startContainer);
          var endEl = (delRange.endContainer.nodeType===3
            ? delRange.endContainer.parentElement : delRange.endContainer);
          var startBlock = startEl.closest('p,h1,h2,h3,h4,li,blockquote');
          var endBlock   = endEl.closest('p,h1,h2,h3,h4,li,blockquote');

          if (startBlock && endBlock && startBlock !== endBlock) {
            // Multi-block delete — find the common parent container
            var commonParent = startBlock.parentElement;
            // Collect blocks between start and end in this container
            var siblings = Array.from(commonParent.children);
            var toDelete = [];
            var inRange = false;
            for (var k=0; k<siblings.length; k++) {
              var sib = siblings[k];
              if (sib === startBlock || sib.contains(this._startMarker)) inRange = true;
              if (inRange) toDelete.push(sib);
              if (sib === endBlock) { break; }
            }
            // Delete all but keep start (remove text after marker) and end (remove text before cursor)
            if (toDelete.length > 1) {
              // Clear text after marker in start block
              var afterMarker = document.createRange();
              afterMarker.setStartAfter(this._startMarker);
              afterMarker.setEnd(startBlock, startBlock.childNodes.length);
              afterMarker.deleteContents();
              // Remove middle blocks
              for (var m=1; m<toDelete.length-1; m++) toDelete[m].remove();
              // Clear text before cursor in end block
              var beforeCursor = document.createRange();
              beforeCursor.setStart(endBlock, 0);
              beforeCursor.setEnd(curRange.endContainer, curRange.endOffset);
              beforeCursor.deleteContents();
              // Merge start and end blocks
              while (toDelete[toDelete.length-1].firstChild) {
                startBlock.appendChild(toDelete[toDelete.length-1].firstChild);
              }
              if (toDelete[toDelete.length-1].parentNode) toDelete[toDelete.length-1].remove();
            } else {
              delRange.deleteContents();
            }
          } else {
            delRange.deleteContents();
          }
        }
      } catch(e) { console.warn('TinyEditor: delete range error', e); }

      this._clearStartMarker();
      this._updateSize();
      return;
    }

    // Case 3: Nothing selected or marked — show hint
    this._showDeleteHint();
  };

  TinyEditor.prototype._deleteBlockRange = function (range) {
    // Find the common ancestor container
    var ancestor = range.commonAncestorContainer;
    if (ancestor.nodeType === 3) ancestor = ancestor.parentElement;

    // Walk up to find a container that is a direct child of editor or md-group
    while (ancestor && ancestor !== this._ed &&
           !ancestor.classList.contains('tfe-md-group') &&
           ancestor.parentElement !== this._ed &&
           !ancestor.parentElement.classList.contains('tfe-md-group')) {
      ancestor = ancestor.parentElement;
    }
    var container = (ancestor && ancestor !== this._ed) ? ancestor.parentElement : this._ed;

    var blocks = Array.from(container.children).filter(function(el) {
      // Skip tfe-md-group-del button and tfe-block-wrap that don't intersect
      return !el.classList.contains('tfe-md-group-del');
    });

    var toDelete = [];
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      try {
        var br = document.createRange();
        br.selectNodeContents(block);
        var cmp1 = range.compareBoundaryPoints(Range.START_TO_END, br);
        var cmp2 = range.compareBoundaryPoints(Range.END_TO_START, br);
        if (cmp1 > 0 && cmp2 < 0) toDelete.push(block);
      } catch(e) {}
    }

    if (toDelete.length === 0) {
      range.deleteContents();
    } else if (toDelete.length === 1) {
      range.deleteContents();
    } else {
      // Delete middle blocks completely
      for (var j = 1; j < toDelete.length - 1; j++) toDelete[j].remove();
      var firstBlock = toDelete[0];
      var lastBlock  = toDelete[toDelete.length - 1];
      // Delete from range start to end of first block
      try {
        var fr = document.createRange();
        fr.setStart(range.startContainer, range.startOffset);
        fr.setEnd(firstBlock, firstBlock.childNodes.length);
        fr.deleteContents();
      } catch(e) {}
      // Delete from start of last block to range end
      try {
        var lr = document.createRange();
        lr.setStart(lastBlock, 0);
        lr.setEnd(range.endContainer, range.endOffset);
        lr.deleteContents();
      } catch(e) {}
      // Merge remaining content of first and last
      while (lastBlock.firstChild) firstBlock.appendChild(lastBlock.firstChild);
      if (lastBlock.parentNode) lastBlock.remove();
    }
  };

  TinyEditor.prototype._rangeOf = function (el) {
    var r = document.createRange();
    r.selectNodeContents(el);
    return r;
  };

  TinyEditor.prototype._showDeleteHint = function () {
    var hint = this._wrap && this._wrap.querySelector('.tfe-size');
    if (!hint) return;
    var orig = hint.textContent;
    hint.textContent = '💡 Select text or click 📍 first, then 🗑';
    hint.style.color = 'var(--tfe-acc,#4f8ef7)';
    setTimeout(function() { hint.textContent = orig; hint.style.color = ''; }, 2500);
  };

  // ── Deletable block wrapper ──────────────────────────────────────────────────
  // Wraps any inserted block with a red ✕ delete button on hover
  TinyEditor.prototype._wrapBlock = function (innerHtml) {
    return '<div class="tfe-block-wrap" contenteditable="false">'
      + '<button class="tfe-del-btn" onclick="this.parentElement.remove()" title="Delete block">&#10005;</button>'
      + innerHtml
      + '</div>';
  };

  // ── Selection watcher — activates 🗑 when text selected ─────────────────────
  TinyEditor.prototype._initSelectionWatcher = function () {
    var self = this;
    document.addEventListener('selectionchange', function () {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !self._ed.contains(sel.anchorNode)) {
        // No selection in our editor — only deactivate if no marker set
        if (!self._startMarker) self._updateDeleteBtn(false);
        return;
      }
      // Text selected in editor → activate delete button
      self._updateDeleteBtn(true);
    });
  };

  // ── Raw HTML Editor ──────────────────────────────────────────────────────────
  TinyEditor.prototype._openRawHtmlEditor = function () {
    var self = this;
    var existing = document.getElementById('tfe-raw-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'tfe-raw-modal';
    modal.className = 'tfe-raw-modal';

    // Phase 1: Warning + confirmation
    modal.innerHTML = '<div class="tfe-raw-box" id="tfe-raw-box">'
      + '<div class="tfe-raw-warn">'
      +   '<div class="tfe-raw-warn-title">⚠️ Raw HTML Mode Warning</div>'
      +   'Editing raw HTML directly can <strong>corrupt your document</strong> if tags are not '
      +   'opened and closed correctly. Broken HTML may cause the editor to malfunction.<br><br>'
      +   'It is <strong>recommended to skip</strong> this and use the toolbar instead. '
      +   'If you still want to edit raw HTML, type exactly:<br><br>'
      +   '<code style="background:var(--tfe-sur2,#1e1e1e);padding:2px 6px;border-radius:4px;color:var(--tfe-acc,#4f8ef7);font-size:12px">'
      +   'i want raw html editing</code>'
      + '</div>'
      + '<div class="tfe-raw-confirm">'
      +   '<label>Type the confirmation phrase to unlock Edit mode:</label>'
      +   '<input id="tfe-raw-phrase" placeholder="i want raw html editing" autocomplete="off" spellcheck="false">'
      + '</div>'
      + '<div class="tfe-raw-btns">'
      +   '<button class="tfe-raw-btn-skip" id="tfe-raw-skip">✓ Skip (Recommended)</button>'
      +   '<button class="tfe-raw-btn-ro" id="tfe-raw-ro">👁 Read Only</button>'
      +   '<button class="tfe-raw-btn-edit" id="tfe-raw-edit">✎ Edit</button>'
      + '</div>'
      + '</div>';

    document.body.appendChild(modal);

    var phraseInput = document.getElementById('tfe-raw-phrase');
    var editBtn     = document.getElementById('tfe-raw-edit');
    var PHRASE      = 'i want raw html editing';

    // Live check phrase
    phraseInput.addEventListener('input', function() {
      var match = phraseInput.value.trim().toLowerCase() === PHRASE;
      editBtn.classList.toggle('tfe-raw-btn-edit--ready', match);
      phraseInput.classList.toggle('tfe-raw-confirm--ok', match);
    });

    // Skip — just close
    document.getElementById('tfe-raw-skip').onclick = function() {
      modal.remove();
    };

    // Read only — show HTML in textarea (non-editable)
    document.getElementById('tfe-raw-ro').onclick = function() {
      self._showRawHtmlView(modal, false);
    };

    // Edit — show HTML in editable textarea
    editBtn.onclick = function() {
      if (!editBtn.classList.contains('tfe-raw-btn-edit--ready')) return;
      self._showRawHtmlView(modal, true);
    };

    // Close on backdrop
    modal.onclick = function(e) {
      if (e.target === modal) modal.remove();
    };

    // Focus phrase input
    setTimeout(function() { phraseInput.focus(); }, 50);
  };

  TinyEditor.prototype._showRawHtmlView = function (modal, editable) {
    var self = this;
    var currentHtml = this._ed.innerHTML;

    // Pretty print HTML
    var pretty = this._prettyHtml(currentHtml);

    var box = document.getElementById('tfe-raw-box');
    if (!box) return;

    box.innerHTML = '<div style="font-size:13px;font-weight:700;color:var(--tfe-txt,#e0e0e0);margin-bottom:4px">'
      + (editable ? '✎ Raw HTML — Edit Mode' : '👁 Raw HTML — Read Only') + '</div>'
      + (editable ? '<div style="font-size:11px;color:#f7c94f;margin-bottom:8px">⚠️ Unclosed or malformed tags will corrupt the document.</div>' : '')
      + '<textarea id="tfe-raw-ta" class="tfe-raw-textarea"'
      + (editable ? '' : ' readonly') + '>' + _esc(pretty) + '</textarea>'
      + '<div class="tfe-raw-footer">'
      + (editable
          ? '<button class="tfe-raw-save" id="tfe-raw-apply">✓ Apply HTML</button>'
          : '')
      + '<button class="tfe-raw-cancel" id="tfe-raw-close">'
      + (editable ? '✕ Cancel' : '✕ Close') + '</button>'
      + '</div>';

    // Close
    document.getElementById('tfe-raw-close').onclick = function() { modal.remove(); };

    // Apply (edit mode only)
    if (editable) {
      document.getElementById('tfe-raw-apply').onclick = function() {
        var rawHtml = document.getElementById('tfe-raw-ta').value;

        // ── Validate HTML before applying ─────────────────────────────────
        var errors = self._validateHtml(rawHtml);
        if (errors.length > 0) {
          self._showHtmlErrors(errors);
          return; // block apply until fixed
        }

        // ── Sanitize: remove scripts and event handlers ────────────────────
        rawHtml = rawHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
        rawHtml = rawHtml.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '');
        rawHtml = rawHtml.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');
        self._ed.innerHTML = rawHtml;
        self._updateSize();
        self._syncLineDelButtons();
        modal.remove();
      };

      // Tab key inserts 2 spaces in textarea
      document.getElementById('tfe-raw-ta').addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
          e.preventDefault();
          var ta = e.target;
          var start = ta.selectionStart;
          var end = ta.selectionEnd;
          ta.value = ta.value.slice(0,start) + '  ' + ta.value.slice(end);
          ta.selectionStart = ta.selectionEnd = start + 2;
        }
      });
    }
  };

  // ── HTML Validator ───────────────────────────────────────────────────────────
  TinyEditor.prototype._validateHtml = function (html) {
    var errors = [];

    // Tags that don't need closing
    var VOID = ['area','base','br','col','embed','hr','img','input','link',
                'meta','param','source','track','wbr'];
    // Tags we validate (block + inline meaningful ones)
    var VALIDATE = ['div','p','h1','h2','h3','h4','h5','h6','ul','ol','li',
                    'table','thead','tbody','tfoot','tr','th','td','blockquote',
                    'pre','code','strong','b','em','i','u','s','del','a',
                    'figure','figcaption','section','article','aside',
                    'header','footer','nav','main','span'];

    var stack = [];     // open tag stack: [{tag, line, col}]
    var lineNum = 1;

    // Tokenise — find all tags
    var tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
    var m;

    // Count lines up to a position
    function lineAt(pos) {
      return html.slice(0, pos).split('\n').length;
    }

    while ((m = tagRe.exec(html)) !== null) {
      var closing  = m[1] === '/';
      var tag      = m[2].toLowerCase();
      var attrs    = m[3];
      var pos      = m.index;
      var isSelf   = attrs.trim().endsWith('/') || VOID.indexOf(tag) !== -1;

      if (VALIDATE.indexOf(tag) === -1) continue; // skip unknown/irrelevant
      if (isSelf || VOID.indexOf(tag) !== -1) continue; // void / self-closing

      if (!closing) {
        // Opening tag — push to stack
        stack.push({ tag: tag, line: lineAt(pos), pos: pos });
      } else {
        // Closing tag — check top of stack
        if (stack.length === 0) {
          errors.push({
            type: 'extra-close',
            msg: 'Unexpected closing tag </' + tag + '> — no matching open tag',
            line: lineAt(pos),
          });
        } else {
          var top = stack[stack.length - 1];
          if (top.tag === tag) {
            stack.pop(); // matched
          } else {
            // Wrong close — check if it matches something deeper
            var found = -1;
            for (var i = stack.length - 1; i >= 0; i--) {
              if (stack[i].tag === tag) { found = i; break; }
            }
            if (found >= 0) {
              // Tags in between are not closed
              var unclosed = stack.slice(found + 1).reverse();
              unclosed.forEach(function(u) {
                errors.push({
                  type: 'unclosed',
                  msg: 'Tag <' + u.tag + '> opened on line ' + u.line + ' is not closed before </' + tag + '>',
                  line: lineAt(pos),
                });
              });
              stack.splice(found); // pop up to found
            } else {
              errors.push({
                type: 'mismatch',
                msg: 'Mismatched tag: </' + tag + '> but last open tag was <' + top.tag + '> (line ' + top.line + ')',
                line: lineAt(pos),
              });
            }
          }
        }
      }
    }

    // Any remaining open tags are unclosed
    stack.forEach(function(u) {
      errors.push({
        type: 'unclosed',
        msg: 'Tag <' + u.tag + '> opened on line ' + u.line + ' is never closed',
        line: u.line,
      });
    });

    // Check unmatched quotes in tag attributes (simple check)
    var attrRe = /<[a-zA-Z][^>]*>/g;
    while ((m = attrRe.exec(html)) !== null) {
      var tagStr = m[0];
      var dq = (tagStr.match(/"/g) || []).length;
      var sq = (tagStr.match(/'/g) || []).length;
      if (dq % 2 !== 0) {
        errors.push({
          type: 'quote',
          msg: 'Unmatched double quote in tag: ' + tagStr.slice(0, 40),
          line: lineAt(m.index),
        });
      }
    }

    return errors;
  };

  TinyEditor.prototype._showHtmlErrors = function (errors) {
    // Show error list inside the modal, above the textarea
    var existing = document.getElementById('tfe-raw-errors');
    if (existing) existing.remove();

    var box = document.createElement('div');
    box.id = 'tfe-raw-errors';
    box.style.cssText = 'background:rgba(226,75,74,.1);border:1px solid rgba(226,75,74,.4);'
      + 'border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;color:var(--tfe-txt,#e0e0e0)';

    var title = document.createElement('div');
    title.style.cssText = 'font-weight:700;color:#e24b4a;margin-bottom:6px;font-size:13px';
    title.textContent = '❌ ' + errors.length + ' HTML error' + (errors.length>1?'s':'') + ' — fix before applying:';
    box.appendChild(title);

    errors.slice(0, 8).forEach(function(err) { // show max 8
      var row = document.createElement('div');
      row.style.cssText = 'padding:3px 0;border-bottom:1px solid rgba(226,75,74,.2);line-height:1.5';
      row.innerHTML = '<span style="color:#f7c94f;font-size:11px">Line ' + err.line + '</span>'
        + ' — ' + _esc(err.msg);
      box.appendChild(row);
    });

    if (errors.length > 8) {
      var more = document.createElement('div');
      more.style.cssText = 'padding-top:4px;color:var(--tfe-mut,#888);font-size:11px';
      more.textContent = '… and ' + (errors.length - 8) + ' more errors';
      box.appendChild(more);
    }

    // Insert before textarea
    var ta = document.getElementById('tfe-raw-ta');
    if (ta && ta.parentNode) ta.parentNode.insertBefore(box, ta);

    // Scroll box into view
    box.scrollIntoView({behavior:'smooth', block:'nearest'});
  };

  // ── Pretty print HTML ─────────────────────────────────────────────────────
  TinyEditor.prototype._prettyHtml = function (html) {
    var INLINE = ['strong','b','em','i','u','s','del','code','mark','sub','sup','span','a','br'];
    var indent = 0;
    var result = '';
    // Simple tokenizer
    var tokens = html.match(/<\/?[a-z][^>]*>|[^<]+/gi) || [];
    tokens.forEach(function(tok) {
      var trimmed = tok.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('</')) {
        // Closing tag
        var tag = trimmed.match(/<\/([a-z][a-z0-9]*)/i);
        if (tag && INLINE.indexOf(tag[1].toLowerCase()) === -1) indent = Math.max(0, indent-1);
        var closingIsInline = INLINE.indexOf((tag&&tag[1]||'').toLowerCase()) !== -1;
        result += (closingIsInline ? '' : ('\n' + '  '.repeat(indent))) + trimmed;
      } else if (trimmed.startsWith('<')) {
        // Opening tag
        var tag2 = trimmed.match(/<([a-z][a-z0-9]*)/i);
        var tagName = (tag2 && tag2[1]||'').toLowerCase();
        var isInline = INLINE.indexOf(tagName) !== -1;
        var selfClose = trimmed.endsWith('/>') || ['br','hr','img','input'].indexOf(tagName) !== -1;
        result += (isInline ? '' : ('\n' + '  '.repeat(indent))) + trimmed;
        if (!isInline && !selfClose) indent++;
      } else {
        // Text node
        result += trimmed;
      }
    });
    return result.trim();
  };

  // ── Floating selection delete button ─────────────────────────────────────────
  TinyEditor.prototype._initSelectionDelete = function () {
    var self = this;
    var btn = document.createElement('button');
    btn.id = 'tfe-sel-del';
    btn.textContent = '✕ Delete selection';
    btn.addEventListener('mousedown', function(e) {
      e.preventDefault();
      var sel = window.getSelection();
      if (sel && !sel.isCollapsed && self._ed.contains(sel.anchorNode)) {
        sel.deleteFromDocument();
        self._updateSize();
      }
      btn.style.display = 'none';
    });
    document.body.appendChild(btn);
    this._selDelBtn = btn;

    // Show/hide on selection change
    document.addEventListener('selectionchange', function() {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !self._ed.contains(sel.anchorNode)) {
        btn.style.display = 'none';
        return;
      }
      // Multi-line check: selection spans >1 block element
      var range = sel.getRangeAt(0);
      var start = range.startContainer;
      var end   = range.endContainer;
      var startBlock = (start.nodeType===3 ? start.parentElement : start).closest('p,h1,h2,h3,li,blockquote,pre,div') || start;
      var endBlock   = (end.nodeType===3   ? end.parentElement   : end).closest('p,h1,h2,h3,li,blockquote,pre,div') || end;
      if (startBlock === endBlock) { btn.style.display='none'; return; }
      // Position above the selection
      var rect = range.getBoundingClientRect();
      btn.style.display = 'block';
      btn.style.top  = Math.max(0, rect.top + window.scrollY - 32) + 'px';
      btn.style.left = (rect.left + rect.width/2 - btn.offsetWidth/2) + 'px';
    });
  };

  // ── Line-level delete buttons (add to every editable block) ───────────────
  TinyEditor.prototype._addLineDelButtons = function () {
    var self = this;
    var SELECTORS = 'p,h1,h2,h3,h4,li,blockquote';
    // Use MutationObserver to add del button to new nodes
    var observer = new MutationObserver(function() { self._syncLineDelButtons(); });
    observer.observe(this._ed, {childList:true, subtree:false});
    this._syncLineDelButtons();
  };

  TinyEditor.prototype._syncLineDelButtons = function () {
    var self = this;
    var blocks = this._ed.querySelectorAll('p,h1,h2,h3,h4,li,blockquote');
    blocks.forEach(function(block) {
      // Skip blocks inside tfe-block-wrap (have own del button) but allow inside tfe-md-group
      if (block.closest('.tfe-block-wrap')) return;
      if (block.querySelector(':scope > .tfe-line-del')) return; // already added
      var btn = document.createElement('button');
      btn.className = 'tfe-line-del';
      btn.title = 'Delete line';
      btn.textContent = '✕';
      btn.contentEditable = 'false';
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        // Re-find the closest block in case DOM changed
        var target = btn.parentElement;
        if(target && target !== self._ed) {
          target.remove();
          self._updateSize();
        }
      });
      btn.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
      });
      block.insertBefore(btn, block.firstChild);
    });
  };

  // ── Wrap MD import in deletable group ─────────────────────────────────────
  TinyEditor.prototype._wrapMdGroup = function (html) {
    return '<div class="tfe-md-group" contenteditable="true">'
      + '<button class="tfe-md-group-del" contenteditable="false" '
      + 'onclick="this.parentElement.remove()" title="Delete entire import">&#10005;</button>'
      + html + '</div>';
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
    // Wrap with deletable block
    var wrap = document.createElement('div');
    wrap.className = 'tfe-block-wrap';
    wrap.contentEditable = 'false';
    var delBtn = document.createElement('button');
    delBtn.className = 'tfe-del-btn';
    delBtn.title = 'Delete block';
    delBtn.innerHTML = '&#10005;';
    delBtn.onclick = function() { wrap.remove(); self._updateSize(); };
    wrap.appendChild(delBtn);
    wrap.appendChild(card);
    var span = btn.closest('.tfe-url-wrap') || btn.parentElement;
    span.replaceWith(wrap);
    self._updateSize();
  };

  // ── Paste handler ──────────────────────────────────────────────────────────
  TinyEditor.prototype._onPaste = function (e) {
    var self = this;
    var cd = e.clipboardData;
    if (!cd) return;

    // Priority 1: pasted image file (screenshot / clipboard image)
    var items = cd.items;
    if (items) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          var file = items[i].getAsFile();
          if (file.size > self.opts.maxImageSize) {
            alert('Image too large. Max: ' + Math.round(self.opts.maxImageSize / 1024) + 'KB');
            return;
          }
          var reader = new FileReader();
          reader.onload = function (ev) {
            document.execCommand('insertHTML', false,
              '<img src="' + ev.target.result + '" style="max-width:100%;border-radius:4px;margin:4px 0">');
            self._updateSize();
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }

    // Priority 2: rich HTML paste (websites, ChatGPT, Google Docs, Word)
    var html = cd.getData('text/html');
    if (html && html.trim().length > 0) {
      e.preventDefault();
      var clean = self._sanitizePastedHtml(html);
      document.execCommand('insertHTML', false, clean);
      self._updateSize();
      clearTimeout(self._urlTimer);
      self._urlTimer = setTimeout(function() { self._detectUrls(); }, 800);
      return;
    }
    // Priority 3: plain text — allow browser default
  };

  // ── Sanitize pasted HTML ─────────────────────────────────────────────────
  TinyEditor.prototype._sanitizePastedHtml = function (raw) {
    // Use DOM parser for reliable sanitisation — avoids regex ordering issues
    var parser = new DOMParser();
    var doc = parser.parseFromString(raw, 'text/html');
    var body = doc.body;

    // ── Walk DOM and rebuild clean HTML ──────────────────────────────────────
    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return '';

      var tag = node.tagName.toLowerCase();

      // Strip completely
      if (['script','style','iframe','object','embed','link','meta',
           'noscript','form','input','button','select','textarea'].indexOf(tag) !== -1) {
        return '';
      }

      var children = Array.from(node.childNodes).map(processNode).join('');

      // Code blocks (pre > code) — preserve ALL newlines and indentation
      if (tag === 'pre') {
        // Walk text nodes inside pre - preserving newlines from br tags
        function extractPreText(n) {
          if (n.nodeType === 3) return n.textContent; // text node
          var t = n.tagName ? n.tagName.toLowerCase() : '';
          if (t === 'br') return '\n';
          // span/code children — recurse
          return Array.from(n.childNodes).map(extractPreText).join('');
        }
        var codeEl = node.querySelector('code') || node;
        var raw = extractPreText(codeEl);
        // Trim only trailing whitespace per line, keep structure
        var lines = raw.split('\n');
        // Remove leading/trailing blank lines only
        while (lines.length && !lines[0].trim()) lines.shift();
        while (lines.length && !lines[lines.length-1].trim()) lines.pop();
        var escaped = lines.join('\n')
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return '<pre style="background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);'
          + 'border-radius:6px;padding:12px;overflow-x:auto;margin:8px 0;white-space:pre;font-family:monospace;font-size:13px">'
          + '<code style="font-family:monospace;font-size:13px;color:var(--tfe-acc,#4f8ef7);white-space:pre;display:block">'
          + escaped + '</code></pre>';
      }
      if (tag === 'code' && node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') {
        return ''; // handled above in pre block
      }

      // Headings
      if (['h1','h2','h3','h4'].indexOf(tag) !== -1) return '<' + tag + '>' + children + '</' + tag + '>';
      if (['h5','h6'].indexOf(tag) !== -1) return '<p><strong>' + children + '</strong></p>';

      // Inline formatting
      if (['strong','b'].indexOf(tag) !== -1) return '<strong>' + children + '</strong>';
      if (['em','i'].indexOf(tag)     !== -1) return '<em>' + children + '</em>';
      if (tag === 'u')                        return '<u>' + children + '</u>';
      if (['s','del','strike'].indexOf(tag) !== -1) return '<del>' + children + '</del>';
      if (tag === 'mark')                     return '<mark>' + children + '</mark>';
      if (tag === 'sub')                      return '<sub>' + children + '</sub>';
      if (tag === 'sup')                      return '<sup>' + children + '</sup>';

      // Inline code
      if (tag === 'code') {
        return '<code style="background:var(--tfe-sur2,#1e1e1e);padding:1px 5px;border-radius:4px;'
          + 'font-family:monospace;font-size:13px;color:var(--tfe-acc,#4f8ef7)">' + children + '</code>';
      }

      // Links
      if (tag === 'a') {
        var href = node.getAttribute('href');
        if (href && !href.startsWith('javascript')) {
          return '<a href="' + href + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + children + '</a>';
        }
        return children;
      }

      // Images
      if (tag === 'img') {
        var src = node.getAttribute('src');
        if (src && (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:image'))) {
          return '<img src="' + src + '" style="max-width:100%;border-radius:4px;margin:4px 0;display:block">';
        }
        return '';
      }

      // Lists
      if (tag === 'ul') return '<ul style="padding-left:20px;margin:4px 0">' + children + '</ul>';
      if (tag === 'ol') return '<ol style="padding-left:20px;margin:4px 0">' + children + '</ol>';
      if (tag === 'li') {
        // ChatGPT wraps li content in <p> — strip those wrappers
        var liContent = children.replace(/^<p>([\s\S]*?)<\/p>$/,'$1').replace(/<p>([\s\S]*?)<\/p>/g,'$1');
        return '<li>' + liContent + '</li>';
      }

      // Blockquote
      if (tag === 'blockquote') {
        return '<blockquote style="border-left:3px solid var(--tfe-acc,#4f8ef7);padding:4px 12px;'
          + 'margin:4px 0;color:var(--tfe-mut,#888)">' + children + '</blockquote>';
      }

      // Table
      if (tag === 'table') {
        return '<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:13px">'
          + children + '</table>';
      }
      if (tag === 'thead') return '<thead>' + children + '</thead>';
      if (tag === 'tbody') return '<tbody>' + children + '</tbody>';
      if (tag === 'tfoot') return '<tfoot>' + children + '</tfoot>';
      if (tag === 'tr')    return '<tr>' + children + '</tr>';
      if (tag === 'th') {
        return '<th style="border:1px solid var(--tfe-bdr,#2d2d2d);padding:6px 10px;'
          + 'background:var(--tfe-sur2,#1e1e1e);font-weight:700;text-align:left">' + children + '</th>';
      }
      if (tag === 'td') {
        return '<td style="border:1px solid var(--tfe-bdr,#2d2d2d);padding:6px 10px">'
          + children + '</td>';
      }

      // HR
      if (tag === 'hr') return '<hr>';

      // BR
      if (tag === 'br') return '<br>';

      // Block containers → paragraph
      if (['p','div','section','article','main','aside','header','footer','nav'].indexOf(tag) !== -1) {
        if (!children.trim()) return '';
        return '<p>' + children + '</p>';
      }

      // Span and unknown inline → just return children
      return children;
    }

    var result = Array.from(body.childNodes).map(processNode).join('');

    // Clean up
    result = result.replace(/<p>\s*<\/p>/g, '');
    result = result.replace(/(<br>){3,}/g, '<br><br>');
    result = result.replace(/<p>(<h[1-4]>)/g, '$1');
    result = result.replace(/(<\/h[1-4]>)<\/p>/g, '$1');

    return result.trim();
  };

  // ── Media Modal ──────────────────────────────────────────────────────────────
  TinyEditor.prototype._openMediaModal = function () {
    var self = this;
    var existing = document.getElementById('tfe-media-modal');
    if (existing) existing.remove();

    var opts = this.opts;
    var showUrl    = opts.showMediaUrl    !== false;
    var showUpload = opts.showMediaUpload !== false;
    var showFiles  = opts.showMediaFiles  !== false && !!opts.listUrl;
    var basePath   = opts.mediaBasePath || '';

    // Build cards HTML
    var urlCard = showUrl ? (
      '<div class="tfe-media-card tfe-media-card--url">'
      + '<div class="tfe-media-label" style="display:flex;align-items:center;gap:6px">'
      + '<span style="font-size:15px">&#128279;</span> URL &mdash; IMAGE, VIDEO OR EMBED</div>'
      + '<div class="tfe-media-row">'
      + '<input class="tfe-media-input" id="tfe-mc-url" placeholder="Paste any URL..." autocomplete="off">'
      + '<button class="tfe-media-btn" id="tfe-mc-embed">Insert</button>'
      + '</div>'
      /* Override buttons — hidden until auto-detect is uncertain */
      + '<div id="tfe-mc-overrides" style="display:none;gap:6px;margin-top:8px">'
      + '<span style="font-size:11px;color:var(--tfe-mut,#888);align-self:center;flex-shrink:0">Insert as:</span>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-img" style="flex:1">&#128444; Image</button>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-vid" style="flex:1">&#127916; Video</button>'
      + '</div>'
      + '<div style="font-size:12px;color:var(--tfe-mut,#888);margin-top:8px;line-height:1.7">'
      + '&#127916;&nbsp;YouTube &middot; Vimeo &middot; Facebook &middot; Instagram &middot; Twitter/X<br>'
      + '&#128444;&nbsp;.jpg .png .gif .webp &nbsp;&#127916;&nbsp;.mp4 .webm'
      + '</div></div>'
    ) : '';

    var uploadCard = showUpload ? (
      '<div class="tfe-media-card tfe-media-card--upload">'
      + '<div class="tfe-media-label" style="display:flex;align-items:center;gap:6px">'
      + '<span style="font-size:15px">&#128193;</span> UPLOAD FILE</div>'
      + '<div class="tfe-media-row">'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-img-upload">&#128444;&nbsp; Image</button>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-vid-upload">&#127916;&nbsp; Video</button>'
      + '</div>'
      + '<div class="tfe-media-upload-progress" id="tfe-upload-progress">'
      + '<div class="tfe-media-upload-progress-bar" id="tfe-upload-bar"></div></div>'
      + '</div>'
    ) : '';

    var pathCard = (basePath && !showFiles) ? (
      '<div class="tfe-media-card tfe-media-card--path">'
      + '<div class="tfe-media-label" style="display:flex;align-items:center;gap:6px">'
      + '<span style="font-size:15px">&#128194;</span> FROM PATH (' + _esc(basePath) + ')</div>'
      + '<div class="tfe-media-row">'
      + '<input class="tfe-media-input" id="tfe-mc-path" placeholder="photo.jpg or subfolder/video.mp4">'
      + '<button class="tfe-media-btn" id="tfe-mc-path-insert">Insert</button>'
      + '</div></div>'
    ) : '';

    var filesCard = showFiles ? (
      '<div class="tfe-media-card tfe-media-card--files" id="tfe-files-card">'
      + '<div class="tfe-media-label" style="display:flex;align-items:center;justify-content:space-between">'
      + '<span style="display:flex;align-items:center;gap:6px"><span style="font-size:15px">&#128241;</span> MY FILES</span>'
      + '<button class="tfe-media-btn" id="tfe-files-show-btn" style="font-size:12px;padding:5px 12px">&#128065; Show Files</button>'
      + '</div>'
      + '<div class="tfe-media-files" id="tfe-files-list" style="display:none"></div>'
      + '<button class="tfe-media-file-insert" id="tfe-file-insert-btn" style="display:none">Insert Selected</button>'
      + '</div>'
    ) : '';

    var modal = document.createElement('div');
    modal.id = 'tfe-media-modal';
    modal.className = 'tfe-media-modal';
    modal.innerHTML = '<div class="tfe-media-box">'
      + '<div class="tfe-media-title">'
      + '<span style="display:flex;align-items:center;gap:8px;font-size:16px">&#128206; Insert Media</span>'
      + '<button class="tfe-media-close" id="tfe-mc-close">&#10005;</button></div>'
      + '<div class="tfe-media-radio" style="margin-bottom:0">'
      + '<label id="tfe-lbl-embed" class="tfe-radio-selected" style="flex:1;justify-content:center">'
      + '<input type="radio" name="tfe-insert-mode" id="tfe-mode-embed" value="embed" checked>'
      + '&nbsp;&#128441;&nbsp;As Embed</label>'
      + '<label id="tfe-lbl-link" style="flex:1;justify-content:center">'
      + '<input type="radio" name="tfe-insert-mode" id="tfe-mode-link" value="link">'
      + '&nbsp;&#128279;&nbsp;As Link</label>'
      + '</div>'
      + urlCard + uploadCard + pathCard + filesCard
      + '</div>';

    document.body.appendChild(modal);

    var close = function() { modal.remove(); };
    document.getElementById('tfe-mc-close').onclick = close;
    modal.onclick = function(e) { if (e.target === modal) close(); };

    // Radio toggle
    ['tfe-mode-embed','tfe-mode-link'].forEach(function(id) {
      var radio = document.getElementById(id);
      if (radio) radio.addEventListener('change', function() {
        document.getElementById('tfe-lbl-embed').classList.toggle('tfe-radio-selected', document.getElementById('tfe-mode-embed').checked);
        document.getElementById('tfe-lbl-link').classList.toggle('tfe-radio-selected',  document.getElementById('tfe-mode-link').checked);
      });
    });

    var isLinkMode = function() {
      return !!(document.getElementById('tfe-mode-link') && document.getElementById('tfe-mode-link').checked);
    };

    // URL insert
    if (showUrl) {
      var getUrl = function() { return (document.getElementById('tfe-mc-url').value || '').trim(); };

      // Show/hide override buttons based on whether URL is ambiguous
      var checkUrlAmbiguity = function(url) {
        if (!url) { document.getElementById('tfe-mc-overrides').style.display='none'; return; }
        var html = self._buildMediaHtml(url);
        // If result is just an <a> link → ambiguous, show overrides
        var isAmbiguous = html.startsWith('<a ') && !html.includes('<iframe') && !html.includes('<img') && !html.includes('<video');
        document.getElementById('tfe-mc-overrides').style.display = isAmbiguous ? 'flex' : 'none';
      };

      document.getElementById('tfe-mc-url').addEventListener('input', function() {
        checkUrlAmbiguity(getUrl());
      });
      document.getElementById('tfe-mc-url').addEventListener('paste', function() {
        setTimeout(function(){ checkUrlAmbiguity(getUrl()); }, 50);
      });

      // Insert — smart auto-detect
      document.getElementById('tfe-mc-embed').onclick = function() {
        var url = getUrl(); if (!url) return;
        if (isLinkMode()) {
          self._ed.focus();
          document.execCommand('insertHTML', false, '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(url) + '</a> ');
          self._updateSize();
        } else {
          self._insertMediaByUrl(url);
        }
        close();
      };

      // 🖼 Force Image override
      document.getElementById('tfe-mc-img').onclick = function() {
        var url = getUrl(); if (!url) return;
        self._ed.focus();
        if (isLinkMode()) {
          document.execCommand('insertHTML', false, '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(url) + '</a> ');
        } else {
          document.execCommand('insertHTML', false,
            self._wrapBlock('<img src="' + _esc(url) + '" style="max-width:100%;border-radius:4px;display:block">') + '<p><br></p>');
        }
        self._updateSize(); close();
      };

      // 🎬 Force Video override
      document.getElementById('tfe-mc-vid').onclick = function() {
        var url = getUrl(); if (!url) return;
        self._ed.focus();
        if (isLinkMode()) {
          document.execCommand('insertHTML', false, '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(url) + '</a> ');
        } else {
          document.execCommand('insertHTML', false,
            self._wrapBlock('<video controls style="max-width:100%;border-radius:6px;display:block;background:#000" preload="metadata">'
              + '<source src="' + _esc(url) + '">Your browser does not support video.</video>') + '<p><br></p>');
        }
        self._updateSize(); close();
      };

      // Enter key → Insert
      document.getElementById('tfe-mc-url').onkeydown = function(e) {
        if (e.key === 'Enter') document.getElementById('tfe-mc-embed').click();
      };
    }

    // Upload buttons
    if (showUpload) {
      document.getElementById('tfe-mc-img-upload').onclick = function() {
        self._pendingUploadAsLink = isLinkMode();
        if (opts.uploadUrl) {
          // server upload
          self._pendingUploadClose = close;
          close();
          self._file_img.click();
        } else {
          close(); self._file_img.click();
        }
      };
      document.getElementById('tfe-mc-vid-upload').onclick = function() {
        self._pendingUploadAsLink = isLinkMode();
        if (opts.uploadUrl) {
          self._pendingUploadClose = close;
          close();
          self._file_vid.click();
        } else {
          close(); self._file_vid.click();
        }
      };
    }

    // Path insert
    if (basePath && !showFiles && document.getElementById('tfe-mc-path-insert')) {
      document.getElementById('tfe-mc-path-insert').onclick = function() {
        var p = (document.getElementById('tfe-mc-path').value || '').trim();
        if (!p) return;
        var full = basePath.replace(/\/+$/, '') + '/' + p.replace(/^\/+/, '');
        if (isLinkMode()) {
          self._ed.focus();
          document.execCommand('insertHTML', false, '<a href="' + _esc(full) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(p) + '</a> ');
          self._updateSize();
        } else {
          self._insertMediaByUrl(full);
        }
        close();
      };
    }

    // My Files picker
    if (showFiles) {
      var filesLoaded = false;
      var selectedFile = null;

      // Show Files button — lazy load
      document.getElementById('tfe-files-show-btn').onclick = function() {
        var listEl = document.getElementById('tfe-files-list');
        var insertBtn = document.getElementById('tfe-file-insert-btn');
        var showBtn = document.getElementById('tfe-files-show-btn');

        if (listEl.style.display === 'none') {
          // Expand
          listEl.style.display = 'flex';
          insertBtn.style.display = 'block';
          showBtn.innerHTML = '&#9650; Hide Files';
          showBtn.style.background = 'var(--tfe-sur2,#1e1e1e)';
          showBtn.style.border = '1px solid var(--tfe-bdr,#2d2d2d)';
          showBtn.style.color = 'var(--tfe-txt,#e0e0e0)';
          if (!filesLoaded) {
            filesLoaded = true;
            listEl.innerHTML = '<div class="tfe-media-file-empty">&#8987; Loading...</div>';
            self._loadFilesList();
          }
        } else {
          // Collapse
          listEl.style.display = 'none';
          insertBtn.style.display = 'none';
          showBtn.innerHTML = '&#128065; Show Files';
          showBtn.style.background = '';
          showBtn.style.border = '';
          showBtn.style.color = '';
        }
      };
      var insertBtn = document.getElementById('tfe-file-insert-btn');

      // File selection
      document.getElementById('tfe-files-list').addEventListener('click', function(e) {
        var row = e.target.closest('.tfe-media-file-row');
        var delBtn = e.target.closest('.tfe-media-file-del');
        if (delBtn) {
          e.stopPropagation();
          var fname = delBtn.dataset.file;
          if (fname && confirm('Delete "' + fname + '"?')) {
            self._deleteFile(fname, function() { self._loadFilesList(); selectedFile = null; insertBtn.classList.remove('tfe-file-insert-ready'); });
          }
          return;
        }
        if (!row) return;
        // Deselect all
        document.querySelectorAll('.tfe-media-file-row').forEach(function(r){ r.classList.remove('tfe-file-selected'); });
        row.classList.add('tfe-file-selected');
        selectedFile = row.dataset.file;
        insertBtn.classList.add('tfe-file-insert-ready');
      });

      // Insert selected
      insertBtn.onclick = function() {
        if (!selectedFile) return;
        var url = selectedFile;
        if (isLinkMode()) {
          self._ed.focus();
          var fname = url.split('/').pop();
          document.execCommand('insertHTML', false, '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(fname) + '</a> ');
          self._updateSize();
        } else {
          self._insertMediaByUrl(url);
        }
        close();
      };
    }

    // Focus URL input
    setTimeout(function() {
      var inp = document.getElementById('tfe-mc-url');
      if (inp) inp.focus();
    }, 50);
  };

  // ── Load files list from server ──────────────────────────────────────────
  TinyEditor.prototype._loadFilesList = function () {
    var self = this;
    var listEl = document.getElementById('tfe-files-list');
    if (!listEl || !this.opts.listUrl) return;

    fetch(this.opts.listUrl)
      .then(function(r) { return r.json(); })
      .then(function(files) {
        if (!files || files.length === 0) {
          listEl.innerHTML = '<div class="tfe-media-file-empty">No files uploaded yet. Use Upload above.</div>';
          return;
        }
        listEl.innerHTML = '';
        files.forEach(function(f) {
          var icon = self._fileIcon(f.name || f);
          var name = f.name || f;
          var size = f.size ? self._formatSize(f.size) : '';
          var date = f.uploaded_at ? new Date(f.uploaded_at).toLocaleDateString() : '';
          var url  = f.url || ((self.opts.mediaBasePath || '') + '/' + name).replace('//', '/');

          var row = document.createElement('div');
          row.className = 'tfe-media-file-row';
          row.dataset.file = url;
          row.innerHTML = '<div class="tfe-media-file-icon">' + icon + '</div>'
            + '<div class="tfe-media-file-info">'
            + '<div class="tfe-media-file-name">' + _esc(name) + '</div>'
            + '<div class="tfe-media-file-meta">' + (size ? size + ' &nbsp;' : '') + (date || '') + '</div>'
            + '</div>'
            + (self.opts.deleteUrl
              ? '<button class="tfe-media-file-del" data-file="' + _esc(name) + '" title="Delete">&#128465;</button>'
              : '');
          listEl.appendChild(row);
        });
      })
      .catch(function() {
        listEl.innerHTML = '<div class="tfe-media-file-empty">&#9888; Could not load files.</div>';
      });
  };

  TinyEditor.prototype._fileIcon = function (name) {
    var ext = (name.split('.').pop() || '').toLowerCase();
    if (['jpg','jpeg','png','gif','webp','svg','bmp'].indexOf(ext) !== -1) return '&#128444;';
    if (['mp4','webm','ogg','mov','avi'].indexOf(ext) !== -1) return '&#127916;';
    if (['mp3','wav','ogg','m4a'].indexOf(ext) !== -1) return '&#127925;';
    if (['pdf'].indexOf(ext) !== -1) return '&#128209;';
    if (['doc','docx'].indexOf(ext) !== -1) return '&#128196;';
    if (['zip','rar','tar'].indexOf(ext) !== -1) return '&#128230;';
    return '&#128196;';
  };

  TinyEditor.prototype._formatSize = function (bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB';
    return (bytes/1048576).toFixed(1) + ' MB';
  };

  TinyEditor.prototype._deleteFile = function (name, cb) {
    if (!this.opts.deleteUrl) return;
    fetch(this.opts.deleteUrl + '/' + encodeURIComponent(name), {method:'DELETE'})
      .then(function() { if (cb) cb(); })
      .catch(function() { alert('Could not delete file'); });
  };

  TinyEditor.prototype._uploadFileToServer = function (file, type, asLink) {
    var self = this;
    var fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);

    // Show progress if modal still open
    var progressWrap = document.getElementById('tfe-upload-progress');
    var progressBar  = document.getElementById('tfe-upload-bar');
    if (progressWrap) { progressWrap.style.display='block'; }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', self.opts.uploadUrl);
    if (progressBar) {
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) progressBar.style.width = (e.loaded/e.total*100) + '%';
      };
    }
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          var url = data.url || data.path || data.filename || '';
          if (!url) throw new Error('No URL in response');
          if (asLink) {
            self._ed.focus();
            var fname = (file.name || url.split('/').pop());
            document.execCommand('insertHTML', false, '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(fname) + '</a> ');
          } else {
            self._insertMediaByUrl(url);
          }
          self._updateSize();
        } catch(e) {
          alert('Upload error: ' + e.message);
        }
      } else {
        alert('Upload failed: ' + xhr.status);
      }
    };
    xhr.onerror = function() { alert('Upload failed'); };
    xhr.send(fd);
  };

  TinyEditor.prototype._insertMediaByUrl = function (url) {
    this._ed.focus();
    var html = this._buildMediaHtml(url);
    // Wrap embeds, images and videos with delete handle
    if (html.includes('<iframe') || html.includes('<video') || html.includes('<img')) {
      html = this._wrapBlock(html);
    }
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
    if (type === 'img' || type === 'vid') {
      var asLink = !!self._pendingUploadAsLink;
      self._pendingUploadAsLink = false;
      // Server upload takes priority over base64
      if (self.opts.uploadUrl) {
        self._uploadFileToServer(file, type, asLink);
        e.target.value = '';
        return;
      }
      // Base64 local fallback
      reader.onload = function (ev) {
        self._ed.focus();
        if (asLink) {
          document.execCommand('insertHTML', false,
            '<a href="' + ev.target.result + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(file.name||type) + '</a> ');
        } else if (type === 'img') {
          document.execCommand('insertHTML', false,
            self._wrapBlock('<img src="' + ev.target.result + '" style="max-width:100%;border-radius:4px;display:block">'));
        } else {
          document.execCommand('insertHTML', false,
            self._wrapBlock('<video controls style="max-width:100%;border-radius:6px;display:block;background:#000" preload="metadata">'
              + '<source src="' + ev.target.result + '" type="' + file.type + '">'
              + 'Your browser does not support video.</video>'));
        }
        self._updateSize();
      };
      reader.readAsDataURL(file);
    } else if (type === 'md') {
    } else if (type === 'md') {
      reader.onload = function (ev) {
        var mdHtml = self._mdToHtml(ev.target.result);
        self._insertHtmlAtCursor(self._wrapMdGroup(mdHtml));
        self._updateSize();
        setTimeout(function() { self._syncLineDelButtons(); }, 100);
      };
      reader.readAsText(file);
    } else if (type === 'html') {
      reader.onload = function (ev) {
        var cleanHtml = self._sanitizeHtml(ev.target.result);
        self._insertHtmlAtCursor(self._wrapMdGroup(cleanHtml));
        self._updateSize();
        setTimeout(function() { self._syncLineDelButtons(); }, 100);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // ── Insert HTML at cursor ──────────────────────────────────────────────────
  TinyEditor.prototype._insertHtmlAtCursor = function (html) {
    var self = this;
    this._ed.focus();

    // Parse into real DOM nodes
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var nodes = Array.from(tmp.childNodes).map(function(n){ return n.cloneNode(true); });

    var sel = window.getSelection();
    if (sel && sel.rangeCount && this._ed.contains(sel.anchorNode)) {
      var range = sel.getRangeAt(0);
      // Find the closest block ancestor that is a direct child of editor
      var anchor = range.startContainer;
      var block = (anchor.nodeType===3 ? anchor.parentElement : anchor);
      while (block && block.parentElement !== self._ed) block = block.parentElement;

      if (block && block !== self._ed) {
        // Insert after the current block (avoids nesting block in p)
        var ref = block.nextSibling;
        var frag = document.createDocumentFragment();
        nodes.forEach(function(n){ frag.appendChild(n); });
        self._ed.insertBefore(frag, ref);
      } else {
        // Fallback: insert at range
        range.deleteContents();
        var frag2 = document.createDocumentFragment();
        nodes.forEach(function(n){ frag2.appendChild(n); });
        range.insertNode(frag2);
      }
    } else {
      nodes.forEach(function(n){ self._ed.appendChild(n); });
    }
    setTimeout(function(){ self._syncLineDelButtons(); }, 80);
  };

  // ── Markdown → HTML ────────────────────────────────────────────────────────
  TinyEditor.prototype._mdToHtml = function (md) {
    var PRE_STYLE = 'background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);'
      + 'border-radius:6px;padding:12px;overflow-x:auto;margin:8px 0;white-space:pre;font-family:monospace';
    var CODE_STYLE = 'font-family:monospace;font-size:13px;color:var(--tfe-acc,#4f8ef7);white-space:pre;display:block';
    var TH_STYLE = 'border:1px solid var(--tfe-bdr,#2d2d2d);padding:6px 10px;'
      + 'background:var(--tfe-sur2,#1e1e1e);font-weight:700;text-align:left';
    var TD_STYLE = 'border:1px solid var(--tfe-bdr,#2d2d2d);padding:6px 10px';

    // Step 1: Extract fenced code blocks first (protect from other replacements)
    var blocks = [];
    md = md.replace(/```(\w*)\n([\s\S]*?)```/gm, function(m, lang, code) {
      var escaped = code.trim()
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      var langLabel = lang ? '<span style="font-size:10px;color:var(--tfe-mut,#888);margin-bottom:6px;display:block">'
        + lang + '</span>' : '';
      var blockHtml = '<pre style="' + PRE_STYLE + '">' + langLabel
        + '<code style="' + CODE_STYLE + '">' + escaped + '</code></pre>';
      var html = '<div class="tfe-block-wrap" contenteditable="false">'
        + '<button class="tfe-del-btn" onclick="this.parentElement.remove()" title="Delete block">&#10005;</button>'
        + blockHtml + '</div>';
      blocks.push(html);
      return '\x00CODE' + (blocks.length-1) + '\x00';
    });

    // Step 2: Tables
    md = md.replace(/^(\|.+\|)\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm, function(m, header, rows) {
      var ths = header.split('|').filter(c=>c.trim()).map(c=>'<th style="'+TH_STYLE+'">'+c.trim()+'</th>').join('');
      var trs = rows.trim().split('\n').map(function(row) {
        var tds = row.split('|').filter(c=>c.trim()).map(c=>'<td style="'+TD_STYLE+'">'+c.trim()+'</td>').join('');
        return '<tr>'+tds+'</tr>';
      }).join('');
      return '<div class="tfe-block-wrap" contenteditable="false">'
        + '<button class="tfe-del-btn" onclick="this.parentElement.remove()" title="Delete block">&#10005;</button>'
        + '<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:13px">'
        + '<thead><tr>'+ths+'</tr></thead><tbody>'+trs+'</tbody></table></div>';
    });

    // Step 3: Blockquotes
    md = md.replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--tfe-acc,#4f8ef7);'
      +'padding:4px 12px;margin:4px 0;color:var(--tfe-mut,#888)">$1</blockquote>');

    // Step 4: Headings
    md = md.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    md = md.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
    md = md.replace(/^# (.+)$/gm,   '<h1>$1</h1>');

    // Step 5: Inline code (before bold/italic so `**bold**` inside code isn't processed)
    md = md.replace(/`([^`\n]+)`/g,
      '<code style="background:var(--tfe-sur2,#1e1e1e);padding:1px 5px;border-radius:4px;'
      +'font-family:monospace;font-size:13px;color:var(--tfe-acc,#4f8ef7)">$1</code>');

    // Step 6: Bold / italic
    md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    md = md.replace(/\*(.+?)\*/g,      '<em>$1</em>');
    md = md.replace(/_(.+?)_/g,          '<em>$1</em>');

    // Step 7: Images and links
    md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(m,alt,src) {
      return '<div class="tfe-block-wrap" contenteditable="false">'
        + '<button class="tfe-del-btn" onclick="this.parentElement.remove()" title="Delete">&#10005;</button>'
        + '<img src="'+src+'" alt="'+alt+'" style="max-width:100%;border-radius:4px;display:block">'
        + '</div>';
    });
    md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">$1</a>');

    // Step 8: Badge images (shields.io style — already handled by image rule above)

    // Step 9: Lists (unordered and ordered)
    md = md.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    md = md.replace(/^[-*] (.+)$/gm,    '<li>$1</li>');
    md = md.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, function(s) {
      return '<ul style="padding-left:20px;margin:4px 0">' + s + '</ul>';
    });

    // Step 10: HR
    md = md.replace(/^---$/gm, '<hr>');

    // Step 11: Paragraphs — split on double newline
    md = md.split('\n\n').map(function(block) {
      block = block.trim();
      if (!block) return '';
      // Already an HTML block — don't wrap in <p>
      if (/^<(h[1-6]|ul|ol|li|table|blockquote|pre|hr|div)/.test(block)) return block;
      if (block.startsWith('\x00CODE')) return block; // placeholder
      return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
    }).join('');

    // Step 12: Restore code blocks
    blocks.forEach(function(html, i) {
      md = md.replace('\x00CODE' + i + '\x00', html);
      // Also handle if wrapped in <p> by paragraph step
      md = md.replace('<p>\x00CODE' + i + '\x00</p>', html);
    });

    return md;
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
