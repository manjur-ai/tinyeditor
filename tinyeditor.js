/*!
 * TinyEditor v0.1.16
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
    maxSize:        10485760,          // Max overall content size (10MB)
    maxImageSize:   1048576,           // Max image/pdf upload size (1MB)
    maxVideoSize:   1048576,           // Max video upload size (1MB)
    mediaBasePath:  '',                // Optional base path e.g. '/uploads/'
    allowedImageTypes: ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml'],
    allowedVideoTypes: ['video/mp4','video/webm','video/ogg'],
    // Media modal section visibility
    showMediaUrl:    true,             // Show URL / embed section
    showMediaUpload: true,             // Show upload file section
    showMediaFiles:  true,             // Show "My Files" picker section
    showCrop:        true,             // Show quadrilateral crop after image capture/upload
    // Server-side upload/list endpoints
    uploadUrl:       null,             // POST endpoint e.g. '/api/upload'
    listUrl:         null,             // GET endpoint e.g. '/api/uploads'
    deleteUrl:       null,             // DELETE endpoint e.g. '/api/uploads'
    darkMode:       'auto',            // 'auto' | 'dark' | 'light'
    pdfPageMode:    'single',          // 'single' = first page + Prev/Next, 'all' = render every page
    linkPreviewUrl: null,              // URL of your link-preview API endpoint
    //   GET {linkPreviewUrl}?url=<encoded>
    //   returns { title, description, image, domain }
    onChange:       null,              // fn(html) — called on every change
    onSave:         null,              // fn(html) — called when Save is clicked
    showSaveButton: true,
    showToolbar:    true,
    toolbar: ['fontSize','bold','italic','heading','importMedia','importDoc','indent','outdent','markStart','deleteSelection'],
  };

  // ── CSS injected once ──────────────────────────────────────────────────────
  const CSS = `
.tfe-pdf-wrap{position:relative;width:100%;border-radius:8px;overflow:hidden;margin:8px 0;border:1px solid var(--tfe-bdr,#2d2d2d)}
.tfe-pdf-canvas-wrap{width:100%;overflow-y:auto;max-height:68vh;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;background:#525659}
.tfe-pdf-canvas-wrap--all{max-height:none;overflow-y:visible}
.tfe-pdf-canvas{display:block;max-width:100%;box-shadow:0 2px 8px rgba(0,0,0,.4);background:#fff}
.tfe-pdf-bar{display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:var(--tfe-sur2,#1e1e1e);font-size:12px;color:var(--tfe-txt,#e0e0e0);gap:8px;border-top:1px solid var(--tfe-bdr,#2d2d2d)}
.tfe-pdf-bar span{flex:1;text-align:center;color:var(--tfe-mut,#888);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tfe-pdf-btn{background:none;border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;color:var(--tfe-txt,#e0e0e0);padding:3px 10px;cursor:pointer;font-size:12px;flex-shrink:0}
.tfe-pdf-btn:hover{background:var(--tfe-acc,#4f8ef7);border-color:var(--tfe-acc,#4f8ef7);color:#fff}
.tfe-pdf-btn:disabled{opacity:.35;pointer-events:none}
.tfe-pdf-loading{text-align:center;padding:24px 16px;color:var(--tfe-mut,#888);font-size:13px}
.tfe-pdf-error{text-align:center;padding:16px;color:#e24b4a;font-size:13px}
.tfe-wrap{display:flex;flex-direction:column;gap:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-sizing:border-box}
.tfe-wrap *{box-sizing:border-box}
.tfe-toolbar{display:flex;gap:3px;padding:6px 8px 8px;border-bottom:1px solid var(--tfe-bdr,#2d2d2d);flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.tfe-toolbar::-webkit-scrollbar{display:none}
.tfe-toolbar-bottom{border-top:1px solid var(--tfe-bdr,#2d2d2d);border-bottom:none;padding:6px 8px env(safe-area-inset-bottom,8px);position:fixed;bottom:0;left:0;right:0;z-index:10000;background:var(--tfe-sur,#141414);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;pointer-events:none;transition:opacity .2s ease,bottom .15s ease;box-shadow:0 -1px 12px rgba(0,0,0,.3)}
.tfe-toolbar-bottom.tfe-tb-visible{opacity:1;pointer-events:auto}
.tfe-btn{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;color:var(--tfe-txt,#e0e0e0);font-size:14px;font-weight:600;padding:6px 10px;cursor:pointer;min-width:32px;transition:background .15s;line-height:1.4;flex:1;min-height:36px}
.tfe-btn *{pointer-events:none}
.tfe-btn:hover{background:var(--tfe-acc,#4f8ef7);color:#fff;border-color:var(--tfe-acc,#4f8ef7)}
.tfe-btn:active{transform:scale(.95)}
.tfe-font-size-select{-moz-appearance:none;-webkit-appearance:none;appearance:none;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;color:var(--tfe-txt,#e0e0e0);font-size:13px;font-weight:600;padding:6px 18px 6px 8px;cursor:pointer;line-height:1.4;flex:1;min-height:36px;text-align:center;text-align-last:center;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 5px center;background-size:8px}
.tfe-font-size-select:hover{border-color:var(--tfe-acc,#4f8ef7)}
.tfe-font-size-select:focus{outline:none;border-color:var(--tfe-acc,#4f8ef7)}
.tfe-size{font-size:10px;color:var(--tfe-mut,#888);text-align:right;padding:2px 0 4px}
.tfe-editor{min-height:160px;overflow-y:auto;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:6px;padding:12px;font-size:14px;line-height:1.7;outline:none;color:var(--tfe-txt,#e0e0e0);word-break:break-word}
.tfe-editor:empty::before{content:attr(data-placeholder);color:var(--tfe-mut,#888);pointer-events:none}
.tfe-editor h1{font-size:20px;font-weight:800;margin:8px 0 4px}
.tfe-editor h2{font-size:17px;font-weight:700;margin:6px 0 3px;color:var(--tfe-acc,#4f8ef7)}
.tfe-editor h3{font-size:15px;font-weight:700;margin:4px 0 2px}
.tfe-editor p{margin:2px 0;color:var(--tfe-txt,#e0e0e0) !important}.tfe-editor{color:var(--tfe-txt,#e0e0e0) !important}.tfe-editor h1,.tfe-editor h2,.tfe-editor h3,.tfe-editor h4,.tfe-editor li,.tfe-editor blockquote{color:var(--tfe-txt,#e0e0e0) !important}
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
.tfe-doc-modal{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:12px}
.tfe-modal-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center}
.tfe-doc-box{background:var(--tfe-sur,#141414);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:14px;padding:20px;width:calc(100vw - 24px);max-width:420px;display:flex;flex-direction:column;gap:10px}
.tfe-doc-title{font-size:16px;font-weight:700;color:var(--tfe-txt,#e0e0e0);display:flex;justify-content:space-between;align-items:center}
.tfe-doc-card{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:10px;padding:14px 16px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:14px}
.tfe-doc-card:hover{border-color:var(--tfe-acc,#4f8ef7);background:rgba(79,142,247,.07)}
.tfe-doc-card-icon{font-size:28px;flex-shrink:0;width:36px;text-align:center}
.tfe-doc-card-info{flex:1}
.tfe-doc-card-name{font-size:14px;font-weight:700;color:var(--tfe-txt,#e0e0e0);margin-bottom:3px}
.tfe-doc-card-desc{font-size:12px;color:var(--tfe-mut,#888);line-height:1.4}
.tfe-doc-card-badge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;flex-shrink:0}
.tfe-doc-card--md{border-left:3px solid #4f8ef7}
.tfe-crop-box{background:var(--tfe-sur,#141414);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:14px;overflow:hidden;text-align:center}
.tfe-doc-card--md .tfe-doc-card-badge{background:rgba(79,142,247,.15);color:#4f8ef7}
.tfe-doc-card--html{border-left:3px solid #4caf50}
.tfe-doc-card--html .tfe-doc-card-badge{background:rgba(76,175,80,.15);color:#4caf50}
.tfe-media-box{background:var(--tfe-sur,#141414);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:14px;padding:14px;width:calc(100vw - 24px);max-width:620px;max-height:calc(100vh - 24px);overflow-y:auto;display:flex;flex-direction:column;gap:8px}
.tfe-media-title{font-size:15px;font-weight:700;color:var(--tfe-txt,#e0e0e0);margin-bottom:2px;display:flex;justify-content:space-between;align-items:center}
.tfe-media-section{margin-bottom:0}
.tfe-media-card{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:10px;padding:10px 14px}
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
.tfe-media-radio{display:flex;gap:0;margin-bottom:0;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:10px;padding:4px;overflow:hidden}
.tfe-media-radio label{display:flex;align-items:center;justify-content:center;gap:7px;font-size:14px;font-weight:600;color:var(--tfe-mut,#888);cursor:pointer;padding:9px 0;border-radius:7px;transition:all .2s;flex:1}
.tfe-media-radio label:hover{color:var(--tfe-txt,#e0e0e0)}
.tfe-media-radio input[type=radio]{display:none}
.tfe-media-radio label.tfe-radio-selected{background:var(--tfe-acc,#4f8ef7);color:#fff;box-shadow:0 2px 8px rgba(79,142,247,.35)}
.tfe-media-title{font-size:15px;font-weight:700;color:var(--tfe-txt,#e0e0e0);margin-bottom:2px;display:flex;justify-content:space-between;align-items:center}
.tfe-media-divider{display:none}
.tfe-media-close{background:none;border:none;color:var(--tfe-mut,#888);font-size:18px;cursor:pointer;padding:0;line-height:1}
.tfe-media-files{display:flex;flex-direction:column;gap:4px;max-height:clamp(120px,26vh,220px);overflow-y:auto;margin-top:8px;padding-bottom:4px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.tfe-media-file-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;background:var(--tfe-sur,#141414);border:1px solid transparent;transition:all .15s}
.tfe-media-file-row:hover{border-color:var(--tfe-acc,#4f8ef7);background:rgba(79,142,247,.06)}
.tfe-media-file-row.tfe-file-selected{border-color:var(--tfe-acc,#4f8ef7);background:rgba(79,142,247,.12)}
.tfe-media-file-icon{font-size:18px;flex-shrink:0;width:24px;text-align:center}
.tfe-media-file-thumb{width:34px;height:34px;border-radius:6px;object-fit:cover;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);flex-shrink:0}
.tfe-media-file-info{flex:1;min-width:0}
.tfe-media-file-name{font-size:13px;color:var(--tfe-txt,#e0e0e0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
.tfe-media-file-meta{font-size:11px;color:var(--tfe-mut,#888);margin-top:1px}
.tfe-media-file-del{background:none;border:none;color:var(--tfe-mut,#888);cursor:pointer;font-size:14px;padding:2px 6px;border-radius:4px;flex-shrink:0;opacity:0;transition:opacity .15s}
.tfe-media-file-row:hover .tfe-media-file-del{opacity:1}
.tfe-media-file-del:hover{color:#e24b4a;background:rgba(226,75,74,.1)}
.tfe-media-file-empty{font-size:13px;color:var(--tfe-mut,#888);text-align:center;padding:16px;border:1px dashed var(--tfe-bdr,#2d2d2d);border-radius:8px}
.tfe-media-file-insert{background:var(--tfe-acc,#4f8ef7);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;padding:9px 18px;cursor:pointer;margin-top:10px;width:100%;opacity:.5;pointer-events:none;transition:opacity .2s}
.tfe-media-file-insert.tfe-file-insert-ready{opacity:1;pointer-events:auto}
.tfe-media-label-input{width:100%;background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:7px;color:var(--tfe-txt,#e0e0e0);padding:7px 10px;font-size:13px;outline:none;margin-bottom:6px;transition:border-color .15s}
.tfe-media-label-input:focus{border-color:var(--tfe-acc,#4f8ef7)}
.tfe-media-label-input::placeholder{color:var(--tfe-mut,#888)}
.tfe-media-label-row{display:flex;flex-direction:column;gap:4px;margin-top:6px}
.tfe-media-label-row--hidden-label{gap:0}
.tfe-media-label-row--hidden-label label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.tfe-media-label-row label{font-size:11px;color:var(--tfe-mut,#888);font-weight:600;letter-spacing:.03em}
.tfe-media-label-input{width:100%;background:var(--tfe-sur2,#1e1e1e);border:1.5px solid var(--tfe-bdr,#2d2d2d);border-radius:7px;color:var(--tfe-txt,#e0e0e0);padding:7px 10px;font-size:13px;outline:none;transition:border-color .15s}
.tfe-media-label-input:focus{border-color:var(--tfe-acc,#4f8ef7)}
.tfe-media-label-input.tfe-label-error{border-color:#e24b4a;animation:tfe-shake .25s}
@keyframes tfe-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
/* Spinner */
.tfe-spinner-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:18px 0;min-height:60px}
.tfe-spinner{width:28px;height:28px;border:3px solid var(--tfe-bdr,#2d2d2d);border-top-color:var(--tfe-acc,#4f8ef7);border-radius:50%;animation:tfe-spin .7s linear infinite;flex-shrink:0}
@keyframes tfe-spin{to{transform:rotate(360deg)}}
.tfe-spinner-msg{font-size:12px;color:var(--tfe-mut,#888);text-align:center;min-height:16px;transition:opacity .2s}
.tfe-spinner-bar-wrap{width:100%;height:4px;background:var(--tfe-bdr,#2d2d2d);border-radius:2px;overflow:hidden;margin-top:4px}
.tfe-spinner-bar{height:100%;background:var(--tfe-acc,#4f8ef7);border-radius:2px;width:0%;transition:width .3s ease}
.tfe-media-upload-progress{height:3px;background:var(--tfe-bdr,#2d2d2d);border-radius:2px;margin-top:8px;display:none}
.tfe-media-upload-progress-bar{height:100%;background:var(--tfe-acc,#4f8ef7);border-radius:2px;width:0;transition:width .3s}
.tfe-media-card--files{border-left:3px solid #9c27b0}
.tfe-preview-card{display:block;border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:8px;overflow:hidden;margin:6px 0;background:var(--tfe-sur,#141414);cursor:pointer;text-decoration:none;max-width:100%}
.tfe-preview-card img{width:100%;max-height:160px;object-fit:cover;display:block}
.tfe-preview-body{padding:8px 10px}
.tfe-preview-title{font-size:13px;font-weight:700;color:var(--tfe-txt,#e0e0e0);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tfe-preview-desc{font-size:11px;color:var(--tfe-mut,#888);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.tfe-preview-domain{font-size:11px;color:var(--tfe-acc,#4f8ef7);margin-top:4px}
.tfe-url-wrap{display:inline-flex;align-items:center;gap:4px}
.tfe-preview-btn{background:var(--tfe-sur2,#1e1e1e);border:1px solid var(--tfe-bdr,#2d2d2d);border-radius:4px;font-size:11px;cursor:pointer;padding:1px 5px;color:var(--tfe-mut,#888);flex-shrink:0}
.tfe-block-wrap{position:relative;margin:4px 0}
.tfe-block-wrap .tfe-del-btn{position:absolute;top:6px;right:6px;width:26px;height:26px;background:rgba(226,75,74,.9);border:1.5px solid rgba(226,75,74,1);border-radius:50%;color:#fff;font-size:13px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;z-index:30;opacity:1;visibility:visible;transition:background .15s,transform .15s;pointer-events:auto}
.tfe-block-wrap:hover .tfe-del-btn,.tfe-block-wrap:focus-within .tfe-del-btn{opacity:1;visibility:visible;pointer-events:auto}
.tfe-block-wrap .tfe-del-btn:hover{background:rgba(226,75,74,1);transform:scale(1.1)}
.tfe-touch .tfe-block-wrap .tfe-del-btn{opacity:1;visibility:visible;pointer-events:auto}
.tfe-editor{padding-left:26px !important}
.tfe-line-del{position:absolute;top:4px;right:4px;left:auto;transform:none;width:22px;height:22px;background:rgba(226,75,74,.9);border:1.5px solid rgba(226,75,74,1);border-radius:50%;color:#fff;font-size:11px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;z-index:30;opacity:1;visibility:visible;transition:background .15s,transform .15s;pointer-events:auto}
.tfe-editor h1:hover>.tfe-line-del,.tfe-editor h2:hover>.tfe-line-del,.tfe-editor h3:hover>.tfe-line-del,.tfe-editor h4:hover>.tfe-line-del,.tfe-editor ul:hover>.tfe-line-del,.tfe-editor ol:hover>.tfe-line-del,.tfe-editor blockquote:hover>.tfe-line-del,.tfe-editor h1>.tfe-line-del:hover,.tfe-editor h2>.tfe-line-del:hover,.tfe-editor h3>.tfe-line-del:hover,.tfe-editor ul>.tfe-line-del:hover,.tfe-editor ol>.tfe-line-del:hover,.tfe-editor blockquote>.tfe-line-del:hover{opacity:1;visibility:visible;pointer-events:auto}
.tfe-line-del:hover{background:rgba(226,75,74,.35)}
.tfe-touch .tfe-editor h1>.tfe-line-del,.tfe-touch .tfe-editor h2>.tfe-line-del,.tfe-touch .tfe-editor h3>.tfe-line-del,.tfe-touch .tfe-editor h4>.tfe-line-del,.tfe-touch .tfe-editor ul>.tfe-line-del,.tfe-touch .tfe-editor ol>.tfe-line-del,.tfe-touch .tfe-editor blockquote>.tfe-line-del{opacity:1;visibility:visible;pointer-events:auto}
.tfe-editor p,.tfe-editor h1,.tfe-editor h2,.tfe-editor h3,.tfe-editor h4,.tfe-editor ul,.tfe-editor ol,.tfe-editor li,.tfe-editor blockquote{position:relative}
#tfe-sel-del{position:fixed;z-index:99999;background:#e24b4a;border:none;border-radius:6px;color:#fff;font-size:12px;font-weight:700;padding:4px 10px;cursor:pointer;display:none;box-shadow:0 2px 8px rgba(0,0,0,.4);pointer-events:auto}
#tfe-sel-del:hover{background:#c0392b}
.tfe-btn.tfe-btn--active{background:var(--tfe-acc,#4f8ef7);color:#fff;border-color:var(--tfe-acc,#4f8ef7)}
.tfe-btn.tfe-btn--danger{background:rgba(226,75,74,.15);color:#e24b4a;border-color:rgba(226,75,74,.5)}
.tfe-btn.tfe-btn--danger:hover{background:#e24b4a;color:#fff}
.tfe-start-marker{display:inline-block;width:2px;height:1.1em;background:var(--tfe-acc,#4f8ef7);vertical-align:text-bottom;border-radius:1px;margin:0 1px;position:relative;animation:tfe-blink 1s step-end infinite}
.tfe-start-marker::before{content:"📍";position:absolute;top:-22px;left:50%;transform:translateX(-50%);font-size:13px;pointer-events:none;line-height:1;animation:none;opacity:1}
.tfe-start-marker::after{content:"";position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid var(--tfe-acc,#4f8ef7);pointer-events:none}
@keyframes tfe-blink{0%,100%{opacity:1}50%{opacity:0}}
.tfe-mark-line{background:rgba(79,142,247,.06)}
.tfe-editor ::selection{background:rgba(79,142,247,.35);color:inherit}
.tfe-md-group{position:relative;border-left:2px solid rgba(79,142,247,.2);padding-left:28px;margin:4px 0}
.tfe-md-group-del{position:absolute;top:4px;left:4px;width:20px;height:20px;background:rgba(226,75,74,.9);border:1.5px solid rgba(226,75,74,1);border-radius:50%;color:#fff;font-size:11px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;z-index:30;opacity:1;visibility:visible;transition:background .15s,transform .15s;pointer-events:auto}
.tfe-md-group:hover>.tfe-md-group-del{opacity:1;visibility:visible;pointer-events:auto}
.tfe-touch .tfe-md-group>.tfe-md-group-del{opacity:1;visibility:visible;pointer-events:auto}
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

  var _scriptSrc = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || '';
  function _assetUrl(path) {
    var base = globalThis.TinyEditorAssetBase || _scriptSrc || (typeof document !== 'undefined' ? document.baseURI : '');
    try { return new URL(path, base).href; }
    catch (e) { return path; }
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
    wrap.style.cssText = 'width:' + (this.opts.width || '100%');

    // ── Toolbar ──────────────────────────────────────────────────────────────
    if (this.opts.showToolbar) {
      const tb = document.createElement('div');
      tb.className = 'tfe-toolbar';
      const FONT_SIZES = ['8','10','12','14','16','18','20','24','28','32','36','48','72'];
      const LABELS = {
        bold:       '<b>B</b>',
        italic:     '<i>I</i>',
        heading:    'H',
        link:       '🔗',
        image:      '📎', // legacy
        importMedia:'📎',
        importMd:   '📄',
        importHtml: '🌐',
        importDoc:  '📄',
        indent:     '→',
        outdent:    '←',
        markStart:  '📍',
        deleteSelection: '🗑',
      };
      const TITLES = {
        bold:'Bold',italic:'Italic',heading:'Heading',
        link:'Insert link',image:'Insert media',importMedia:'Insert media',
        importMd:'Import .md file',importHtml:'Import HTML file (no JS)',importDoc:'Import document (.md / .html)',
        indent:'Indent (Tab)',outdent:'Outdent (Shift+Tab)',
        markStart:'Mark selection start',
        deleteSelection:'Delete forward / selection / marked range',
      };
      this.opts.toolbar.forEach(name => {
        if (name === 'fontSize') {
          const sel = document.createElement('select');
          sel.className = 'tfe-btn tfe-font-size-select';
          sel.title = 'Font size';
          sel.dataset.action = 'fontSize';
          FONT_SIZES.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            sel.appendChild(opt);
          });
          sel.addEventListener('change', () => this._tbFontSize(sel.value));
          tb.appendChild(sel);
          return;
        }
        const btn = document.createElement('button');
        btn.className = 'tfe-btn';
        btn.type = 'button';
        btn.innerHTML = LABELS[name] || name;
        btn.title = TITLES[name] || name;
        btn.dataset.action = name;
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
    ed.addEventListener('beforeinput', (e) => this._onBeforeInput(e));
    ed.addEventListener('keydown', (e) => this._onKeyDown(e));
    ed.addEventListener('click', (e) => this._onEditorClick(e));
    ed.addEventListener('touchend', (e) => this._onEditorClick(e));
    ed.addEventListener('mousedown', (e) => {
      if (e.target && e.target.closest && e.target.closest('.tfe-del-btn,.tfe-line-del,.tfe-md-group-del')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    wrap.appendChild(ed);
    this._ed = ed;

    // ── Hidden file inputs ───────────────────────────────────────────────────
    ['img','cam','vid','md','html','pdf'].forEach(type => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.style.display = 'none';
      inp.accept = (type === 'img' || type === 'cam') ? 'image/*' : type === 'vid' ? 'video/*' : type === 'md' ? '.md,.txt' : type === 'html' ? '.html,.htm' : '.pdf';
      if (type === 'cam') inp.setAttribute('capture', 'environment');
      // Image picker allows multiple selection (notes, self-notes, etc.)
      // Camera stays single (capture = environment).
      if (type === 'img') inp.multiple = !!(this.opts.multipleImages !== false);
      inp.addEventListener('change', (e) => this._fileChosen(type === 'cam' ? 'img' : type, e));
      wrap.appendChild(inp);
      this['_file_' + type] = inp;  // _file_img, _file_cam, _file_vid, _file_md, _file_html
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
    this._markBtn = null; // lazily found in _updateMarkerBtn
    this._refreshValueFlags();
    this._updateSize();
    this._initSelectionDelete();
    this._addLineDelButtons();
    this._initSelectionWatcher();
    this._initMobileToolbar();
    this._schedulePdfJsPreload();
    setTimeout(() => this._renderAllPdfs(), 80);
    // Add touch class so CSS can show del buttons without hover
    if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) {
      wrap.classList.add('tfe-touch');
    }
  };

  // ── Toolbar actions ────────────────────────────────────────────────────────
  TinyEditor.prototype._tbFontSize = function (px) {
    this._ed.focus();
    var marker = '7';
    document.execCommand('fontSize', false, marker);
    var fonts = this._ed.querySelectorAll('font[size="' + marker + '"]');
    fonts.forEach(function (f) {
      var span = document.createElement('span');
      span.style.fontSize = px + 'px';
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });
    this._updateSize();
  };

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
      case 'link':       this._openMediaModal(); break;
      case 'image':      this._openMediaModal(); break; // legacy alias
      case 'importMedia':this._openMediaModal(); break;
      case 'importMd':   this._file_md.click(); break;
      case 'importHtml': this._file_html.click(); break;
      case 'importDoc':  this._openImportDocModal(); break;
      case 'indent':         this._indent(true); break;
      case 'outdent':        this._indent(false); break;
      case 'markStart':      this._markSelectionStart(); break;
      case 'deleteSelection':this._deleteSelection(); break;
    }
    this._updateSize();
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  TinyEditor.prototype._onEditorClick = function (e) {
    var btn = e.target && e.target.closest &&
      e.target.closest('.tfe-del-btn,.tfe-line-del,.tfe-md-group-del');
    if (!btn || !this._ed.contains(btn)) return;

    e.preventDefault();
    e.stopPropagation();

    var target = null;
    if (btn.classList.contains('tfe-md-group-del')) {
      target = btn.closest('.tfe-md-group');
    } else if (btn.classList.contains('tfe-line-del')) {
      target = btn.parentElement;
    } else {
      target = btn.closest('.tfe-block-wrap') || btn.parentElement;
    }

    if (target && target !== this._ed && this._ed.contains(target)) {
      target.remove();
      this._markValueDirty();
      this._scheduleLineDelSync();
      this._updateSize();
      if (typeof this.opts.onChange === 'function') this.opts.onChange(this._ed.innerHTML);
    }
  };

  TinyEditor.prototype._onKeyDown = function (e) {
    var self = this;

    // ── Table cell keyboard fixes ────────────────────────────────────────────
    var sel = window.getSelection();
    var anchor = sel && sel.anchorNode;
    var cell = anchor && (anchor.nodeType === 3 ? anchor.parentElement : anchor).closest('td,th');

    if (this._startMarker && sel && sel.rangeCount && this._ed.contains(sel.anchorNode)) {
      e.preventDefault();
      this._cancelStartMarkerFromKeyboard();
      return;
    }

    // ── Guard Backspace/Delete against eating line-del button ───────────────
    if ((e.key === 'Backspace' || e.key === 'Delete') && !cell) {
      var bSel = window.getSelection();
      if (bSel && bSel.rangeCount) {
        var bRange = bSel.getRangeAt(0);
        if (bRange.collapsed) {
          var bNode = bRange.startContainer;
          var bOffset = bRange.startOffset;
          // Backspace at offset 0 — check if prev node is a tfe-line-del
          if (e.key === 'Backspace' && bOffset === 0 && bNode.nodeType === 3) {
            var bPrev = bNode.previousSibling;
            if (bPrev && bPrev.classList && bPrev.classList.contains('tfe-line-del')) {
              e.preventDefault(); // don't delete the button
              return;
            }
          }
          // Backspace when cursor IS on the line-del button node
          if (e.key === 'Backspace' && bNode.nodeType === 1) {
            var bFirst = bNode.firstChild;
            if (bFirst && bFirst.classList && bFirst.classList.contains('tfe-line-del') && bOffset === 0) {
              // Cursor is at block start, block contains line-del as firstChild
              e.preventDefault();
              return;
            }
          }
          // Delete at end of text — check if next node is line-del (shouldn't happen but guard)
          if (e.key === 'Delete' && bNode.nodeType === 3 && bOffset === bNode.length) {
            var bNext = bNode.nextSibling;
            if (bNext && bNext.classList && bNext.classList.contains('tfe-line-del')) {
              e.preventDefault();
              return;
            }
          }
        }
      }
    }

    if (cell) {
      // Ctrl+A inside table cell → select only cell contents (not whole editor)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        var r = document.createRange();
        r.selectNodeContents(cell);
        sel.removeAllRanges();
        sel.addRange(r);
        return;
      }
      // Tab in table cell → move to next cell (not indent)
      if (e.key === 'Tab') {
        e.preventDefault();
        var cells = Array.from(cell.closest('table').querySelectorAll('td,th'));
        var idx = cells.indexOf(cell);
        var next = cells[e.shiftKey ? idx - 1 : idx + 1];
        if (next) {
          var r2 = document.createRange();
          r2.selectNodeContents(next);
          r2.collapse(false);
          sel.removeAllRanges();
          sel.addRange(r2);
        }
        return;
      }
      // Delete / Backspace at cell boundary — don't let it escape the cell
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Let the browser handle normal in-cell deletion
        // Only block if selection would escape the cell
        var range = sel.rangeCount ? sel.getRangeAt(0) : null;
        if (range && !range.collapsed) {
          // Has selection — check if it spans outside the cell
          var startInCell = cell.contains(range.startContainer);
          var endInCell   = cell.contains(range.endContainer);
          if (startInCell && !endInCell) {
            // Selection extends beyond cell — clamp to cell
            e.preventDefault();
            var clamp = document.createRange();
            clamp.setStart(range.startContainer, range.startOffset);
            clamp.setEnd(cell, cell.childNodes.length);
            clamp.deleteContents();
            self._updateSize();
            return;
          }
          if (!startInCell && endInCell) {
            e.preventDefault();
            var clamp2 = document.createRange();
            clamp2.setStart(cell, 0);
            clamp2.setEnd(range.endContainer, range.endOffset);
            clamp2.deleteContents();
            self._updateSize();
            return;
          }
        }
        // Normal in-cell delete — let browser handle it
        return;
      }
    }

    if (e.key === 'Delete' && sel && sel.rangeCount && this._ed.contains(sel.anchorNode)) {
      e.preventDefault();
      this._deleteSelection();
      return;
    }

    if (e.key === 'Backspace' && sel && sel.rangeCount && this._ed.contains(sel.anchorNode)) {
      e.preventDefault();
      this._backspaceSelection();
      return;
    }

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

  TinyEditor.prototype._onBeforeInput = function (e) {
    if (this._startMarker) {
      e.preventDefault();
      this._cancelStartMarkerFromKeyboard();
      return;
    }

    if (!e || e.inputType !== 'deleteContentBackward') return;
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || !this._ed.contains(sel.anchorNode)) return;

    var anchor = sel.anchorNode;
    var anchorEl = anchor.nodeType === 3 ? anchor.parentElement : anchor;
    if (anchorEl && anchorEl.closest && anchorEl.closest('td,th')) return;

    var range = sel.getRangeAt(0);
    if (!range.collapsed) return;

    var atomic = this._findPreviousAtomicBlock(range);
    if (!atomic) return;

    e.preventDefault();
    atomic.remove();
    this._afterNativeDelete();
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
    this._markValueDirty();
    // Use string length as byte approximation (O(1) vs Blob constructor)
    // Accurate for ASCII; ~1.5x for UTF-8 heavy content — good enough for progress indicator
    var bytes = this._ed.innerHTML.length;
    var kb = (bytes / 1024).toFixed(1);
    var maxKb = Math.round(this.opts.maxSize / 1024);
    this._sizeEl.textContent = kb + ' KB / ' + maxKb + ' KB';
    this._sizeEl.style.color =
      bytes > this.opts.maxSize * 0.9 ? '#e24b4a' :
      bytes > this.opts.maxSize * 0.7 ? '#f7c94f' : '';
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  TinyEditor.prototype._save = function () {
    const html = this.getValue();
    const size = html.length; // fast approximation — same as _updateSize
    if (size > this.opts.maxSize) {
      alert('Note too large. Max size: ' + Math.round(this.opts.maxSize / 1024) + 'KB');
      return;
    }
    if (typeof this.opts.onSave === 'function') {
      this.opts.onSave(html);
    }
  };

  // ── Get / Set value ────────────────────────────────────────────────────────
  TinyEditor.prototype._refreshValueFlags = function () {
    if (!this._ed) return;
    var html = this._ed.innerHTML || '';
    this._hasEditorUi = html.indexOf('tfe-line-del') !== -1 ||
      html.indexOf('tfe-del-btn') !== -1 ||
      html.indexOf('tfe-md-group-del') !== -1 ||
      html.indexOf('tfe-start-marker') !== -1 ||
      html.indexOf('data-tfe-marker') !== -1;
    this._hasPdfEmbeds = html.indexOf('tfe-pdf-wrap') !== -1 && html.indexOf('data-pdf-src') !== -1;
    this._hasMdGroups = html.indexOf('tfe-md-group') !== -1;
  };

  TinyEditor.prototype._markValueDirty = function () {
    this._valueFlagsDirty = true;
  };

  TinyEditor.prototype.getValue = function () {
    var ed = this._ed;
    if (this._valueFlagsDirty) {
      this._refreshValueFlags();
      this._valueFlagsDirty = false;
    }
    // Fast path: feature flags let clean content skip DOM queries.
    if (!this._hasEditorUi && !this._hasPdfEmbeds) return ed.innerHTML;

    // Slow path: clone + strip UI-only elements
    var clone = ed.cloneNode(true);
    clone.querySelectorAll(
      '.tfe-start-marker,[data-tfe-marker],.tfe-line-del,.tfe-del-btn,.tfe-md-group-del'
    ).forEach(function(el){ el.remove(); });
    clone.querySelectorAll('.tfe-pdf-wrap[data-pdf-src]').forEach(function(wrap) {
      var label = wrap.getAttribute('data-pdf-label') || 'Loading PDF...';
      wrap.removeAttribute('data-pdf-loaded');
      wrap.innerHTML = '<div class="tfe-pdf-loading">&#128209; ' + _esc(label) + '</div>';
    });
    return clone.innerHTML;
  };

  TinyEditor.prototype.setValue = function (html) {
    if (this._startMarker) this._clearStartMarker();
    this._ed.innerHTML = html || '';
    this._refreshValueFlags();
    this._valueFlagsDirty = false;
    this._updateSize();
    this._renderAllPdfs();
    this._scheduleLineDelSync();
  };

  TinyEditor.prototype.focus = function () {
    this._ed.focus();
  };

  TinyEditor.prototype.setReadOnly = function (isReadOnly) {
    if (isReadOnly && this._startMarker) this._clearStartMarker();
    if (this._ed) this._ed.contentEditable = isReadOnly ? 'false' : 'true';
    if (this._wrap) this._wrap.classList.toggle('tfe-readonly', !!isReadOnly);
    return this;
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

    // If already marked — clear and reset
    if (this._startMarker) {
      this._clearStartMarker();
      return;
    }

    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    var range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);

    // Skip line-del button node if cursor is at block start
    var sc = range.startContainer;
    if (sc.nodeType === 1 && sc.firstChild && sc.firstChild.classList &&
        sc.firstChild.classList.contains('tfe-line-del')) {
      range.setStart(sc, 1);
    }

    // Insert blinking marker at cursor position
    var marker = document.createElement('span');
    marker.className = 'tfe-start-marker';
    marker.contentEditable = 'false';
    marker.setAttribute('data-tfe-marker', '1');
    range.insertNode(marker);

    this._startMarker = marker;
    this._startMarkerBlock = marker.closest('p,h1,h2,h3,h4,li,blockquote,div');
    this._hasEditorUi = true;
    this._valueFlagsDirty = false;

    // Update 📍 button → active blue
    this._updateMarkerBtn(true);

    // Move cursor to just after the marker
    var r2 = document.createRange();
    r2.setStartAfter(marker);
    r2.collapse(true);
    this._markerCursorRange = r2.cloneRange();
    sel.removeAllRanges();
    sel.addRange(r2);

    // Start listening for cursor moves to highlight the range
    self._markerSelListener = function() { self._highlightMarkerRange(); };
    document.addEventListener('selectionchange', self._markerSelListener);
  };

  // Highlight the range from marker to current cursor using native Selection API
  TinyEditor.prototype._highlightMarkerRange = function () {
    if (!this._startMarker || !this._ed) return;
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    // Only act when cursor is inside our editor
    if (!this._ed.contains(sel.anchorNode)) return;

    var curRange = sel.getRangeAt(0);
    this._markerCursorRange = curRange.cloneRange();
    this._markerCursorRange.collapse(false);

    // Build selection range: from after marker → to current cursor
    try {
      var highlightRange = document.createRange();
      highlightRange.setStartAfter(this._startMarker);
      highlightRange.setEnd(curRange.endContainer, curRange.endOffset);

      // If cursor is before marker, flip direction
      if (highlightRange.collapsed) {
        highlightRange.setStart(curRange.startContainer, curRange.startOffset);
        highlightRange.setEndBefore(this._startMarker);
      }

      if (!highlightRange.collapsed) {
        sel.removeAllRanges();
        sel.addRange(highlightRange);
        // Store the range so 🗑 can use it
        this._markerHighlightRange = highlightRange.cloneRange();
        this._updateDeleteBtn(true);
      } else {
        this._markerHighlightRange = null;
        this._updateDeleteBtn(false);
      }
    } catch(e) {}
  };

  TinyEditor.prototype._clearStartMarker = function (restoreRange) {
    // Remove selection listener
    if (this._markerSelListener) {
      document.removeEventListener('selectionchange', this._markerSelListener);
      this._markerSelListener = null;
    }
    // Remove the marker span
    if (this._startMarker && this._startMarker.parentNode) {
      this._startMarker.remove();
    }
    this._startMarker = null;
    this._startMarkerBlock = null;
    this._markerHighlightRange = null;
    this._markerCursorRange = null;
    this._markValueDirty();
    // Clear browser selection
    var sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      if (restoreRange) {
        try {
          restoreRange.collapse(false);
          sel.addRange(restoreRange);
        } catch(e) {}
      }
    }
    // Reset buttons
    this._updateMarkerBtn(false);
    this._updateDeleteBtn(false);
  };

  TinyEditor.prototype._cancelStartMarkerFromKeyboard = function () {
    if (!this._startMarker) return;
    var restoreRange = this._markerCursorRange ? this._markerCursorRange.cloneRange() : null;
    if (!restoreRange) {
      var sel = window.getSelection();
      if (sel && sel.rangeCount) {
        restoreRange = sel.getRangeAt(0).cloneRange();
        restoreRange.collapse(false);
      }
    }
    this._clearStartMarker(restoreRange);
    this._ed.focus();
  };

  TinyEditor.prototype._updateMarkerBtn = function (active) {
    // Use data-action selector so title change doesn't break lookup
    var btn = this._wrap && this._wrap.querySelector('.tfe-btn[data-action="markStart"]');
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
    var btn = this._wrap && this._wrap.querySelector('.tfe-btn[data-action="deleteSelection"]');
    if (!btn) return;
    if (active) btn.classList.add('tfe-btn--danger');
    else btn.classList.remove('tfe-btn--danger');
  };

  TinyEditor.prototype._deleteSelection = function () {
    var sel = window.getSelection();

    if (this._startMarker) {
      var delSel = window.getSelection();
      var useRange = null;
      if (delSel && !delSel.isCollapsed && this._ed.contains(delSel.anchorNode)) {
        useRange = delSel.getRangeAt(0).cloneRange();
      } else if (this._markerHighlightRange) {
        useRange = this._markerHighlightRange.cloneRange();
      }

      if (useRange && !useRange.collapsed) {
        if (this._startMarker && this._startMarker.parentNode) {
          this._startMarker.remove();
          this._startMarker = null;
        }
        this._deleteRange(useRange);
        this._clearStartMarker();
      } else {
        this._clearStartMarker();
        this._showDeleteHint();
      }
      return;
    }

    if (sel && !sel.isCollapsed && this._ed.contains(sel.anchorNode)) {
      this._deleteRange(sel.getRangeAt(0));
      return;
    }

    if (sel && sel.isCollapsed && this._ed.contains(sel.anchorNode)) {
      this._forwardDelete();
      return;
    }

    this._showDeleteHint();
  };

  TinyEditor.prototype._backspaceSelection = function () {
    var sel = window.getSelection();

    if (this._startMarker) {
      var delSel = window.getSelection();
      var useRange = null;
      if (delSel && !delSel.isCollapsed && this._ed.contains(delSel.anchorNode)) {
        useRange = delSel.getRangeAt(0).cloneRange();
      } else if (this._markerHighlightRange) {
        useRange = this._markerHighlightRange.cloneRange();
      }

      if (useRange && !useRange.collapsed) {
        if (this._startMarker && this._startMarker.parentNode) {
          this._startMarker.remove();
          this._startMarker = null;
        }
        this._deleteRange(useRange);
        this._clearStartMarker();
      } else {
        this._clearStartMarker();
        this._showDeleteHint();
      }
      return;
    }

    if (sel && !sel.isCollapsed && this._ed.contains(sel.anchorNode)) {
      this._deleteRange(sel.getRangeAt(0));
      return;
    }

    if (sel && sel.isCollapsed && this._ed.contains(sel.anchorNode)) {
      this._backwardDelete();
      return;
    }

    this._showDeleteHint();
  };

  TinyEditor.prototype._deleteRange = function (range) {
    try { range.deleteContents(); } catch(e) { return false; }
    var sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
    this._afterNativeDelete();
    return true;
  };

  TinyEditor.prototype._afterNativeDelete = function () {
    this._syncLineDelButtons();
    this._detectUrls();
    this._updateSize();
    if (typeof this.opts.onChange === 'function') this.opts.onChange(this._ed.innerHTML);
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

      // Helper: first real child node (skip tfe-line-del button)
      var firstReal = function(el) {
        var c = el.firstChild;
        while (c && c.classList && c.classList.contains('tfe-line-del')) c = c.nextSibling;
        return c;
      };
      var firstRealIdx = function(el) {
        var idx = 0;
        var c = el.firstChild;
        while (c && c.classList && c.classList.contains('tfe-line-del')) { c = c.nextSibling; idx++; }
        return idx;
      };

      // Delete from range start to end of first block (skip line-del button)
      try {
        var fr = document.createRange();
        fr.setStart(range.startContainer, range.startOffset);
        fr.setEnd(firstBlock, firstBlock.childNodes.length);
        fr.deleteContents();
      } catch(e) {}
      // Delete from start of last block to range end (skip line-del button)
      try {
        var lr = document.createRange();
        lr.setStart(lastBlock, firstRealIdx(lastBlock));
        lr.setEnd(range.endContainer, range.endOffset);
        lr.deleteContents();
      } catch(e) {}
      // Merge: move real children of lastBlock into firstBlock (skip line-del)
      var child = firstReal(lastBlock);
      while (child) {
        var nxt = child.nextSibling;
        firstBlock.appendChild(child);
        child = nxt;
      }
      if (lastBlock.parentNode) lastBlock.remove();
    }
  };

  TinyEditor.prototype._rangeOf = function (el) {
    var r = document.createRange();
    r.selectNodeContents(el);
    return r;
  };

  // ── Forward delete (like keyboard Delete key) ────────────────────────────
  // Deletes one character/node forward from cursor, handling tag boundaries
  // Forward delete that stays native-first and only custom-handles atomic editor blocks.
  TinyEditor.prototype._forwardDelete = function () {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || !this._ed.contains(sel.anchorNode)) return false;
    var range = sel.getRangeAt(0);
    if (!range.collapsed) return this._deleteRange(range);

    var before = this._ed.innerHTML;
    try { document.execCommand('forwardDelete', false, null); } catch(e) {}
    if (this._ed.innerHTML !== before) {
      this._afterNativeDelete();
      return true;
    }

    var atomic = this._findNextAtomicBlock(range);
    if (atomic) {
      atomic.remove();
      this._afterNativeDelete();
      return true;
    }
    return false;
  };

  TinyEditor.prototype._backwardDelete = function () {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || !this._ed.contains(sel.anchorNode)) return false;
    var range = sel.getRangeAt(0);
    if (!range.collapsed) return this._deleteRange(range);

    var before = this._ed.innerHTML;
    try { document.execCommand('delete', false, null); } catch(e) {}
    if (this._ed.innerHTML !== before) {
      this._afterNativeDelete();
      return true;
    }

    var atomic = this._findPreviousAtomicBlock(range);
    if (atomic) {
      atomic.remove();
      this._afterNativeDelete();
      return true;
    }
    return false;
  };

  TinyEditor.prototype._isEditorUiNode = function (node) {
    return !!(node && node.nodeType === 1 && node.matches &&
      node.matches('.tfe-line-del,.tfe-del-btn,.tfe-md-group-del,.tfe-start-marker'));
  };

  TinyEditor.prototype._atomicRoot = function (node) {
    if (!node || node.nodeType !== 1) return null;
    var el = node;
    if (el.closest) {
      var wrap = el.closest('.tfe-block-wrap');
      if (wrap && this._ed.contains(wrap)) return wrap;
    }
    if (el.matches && el.matches('[contenteditable="false"],.tfe-preview-card,img,video,iframe,table,pre,.tfe-pdf-wrap')) {
      return el;
    }
    return null;
  };

  TinyEditor.prototype._nodeAfterCaret = function (range) {
    var node = range.startContainer;
    var offset = range.startOffset;
    if (node.nodeType === 3) {
      if (offset < node.nodeValue.length) return null;
    } else if (node.nodeType === 1 && offset < node.childNodes.length) {
      return node.childNodes[offset];
    }
    while (node && node !== this._ed) {
      if (node.nextSibling) return node.nextSibling;
      node = node.parentNode;
    }
    return null;
  };

  TinyEditor.prototype._nodeBeforeCaret = function (range) {
    var node = range.startContainer;
    var offset = range.startOffset;
    if (node.nodeType === 3) {
      if (offset > 0) return null;
    } else if (node.nodeType === 1 && offset > 0) {
      return node.childNodes[offset - 1];
    }
    while (node && node !== this._ed) {
      if (node.previousSibling) return node.previousSibling;
      node = node.parentNode;
    }
    return null;
  };

  TinyEditor.prototype._nextDomNode = function (node) {
    if (!node) return null;
    if (node.firstChild) return node.firstChild;
    while (node && node !== this._ed) {
      if (node.nextSibling) return node.nextSibling;
      node = node.parentNode;
    }
    return null;
  };

  TinyEditor.prototype._previousDomNode = function (node) {
    if (!node) return null;
    if (node.previousSibling) {
      node = node.previousSibling;
      while (node && node.lastChild) node = node.lastChild;
      return node;
    }
    if (node.parentNode && node.parentNode !== this._ed) return node.parentNode;
    return null;
  };

  TinyEditor.prototype._findNextAtomicBlock = function (range) {
    var node = this._nodeAfterCaret(range);
    while (node && this._ed.contains(node)) {
      if (this._isEditorUiNode(node)) { node = this._nextDomNode(node); continue; }
      if (node.nodeType === 3) {
        if (node.nodeValue && node.nodeValue.length) return null;
        node = this._nextDomNode(node);
        continue;
      }
      var atomic = this._atomicRoot(node);
      if (atomic) return atomic;
      var tag = node.nodeType === 1 && node.tagName ? node.tagName.toLowerCase() : '';
      if (['p','h1','h2','h3','h4','li','blockquote','ul','ol'].indexOf(tag) !== -1) return null;
      node = this._nextDomNode(node);
    }
    return null;
  };

  TinyEditor.prototype._findPreviousAtomicBlock = function (range) {
    var node = this._nodeBeforeCaret(range);
    while (node && this._ed.contains(node)) {
      if (this._isEditorUiNode(node)) { node = this._previousDomNode(node); continue; }
      if (node.nodeType === 3) {
        if (node.nodeValue && node.nodeValue.length) return null;
        node = this._previousDomNode(node);
        continue;
      }
      var atomic = this._atomicRoot(node);
      if (atomic) return atomic;
      var tag = node.nodeType === 1 && node.tagName ? node.tagName.toLowerCase() : '';
      if (['p','h1','h2','h3','h4','li','blockquote','ul','ol'].indexOf(tag) !== -1) return null;
      node = this._previousDomNode(node);
    }
    return null;
  };

  TinyEditor.prototype._showDeleteHint = function () {
    if (!this._sizeEl) return;
    var hint = this._sizeEl;
    var orig = hint.textContent;
    hint.textContent = '💡 Select text or click 📍 first, then 🗑';
    hint.style.color = 'var(--tfe-acc,#4f8ef7)';
    setTimeout(function() { hint.textContent = orig; hint.style.color = ''; }, 2500);
  };

  // ── Deletable block wrapper ──────────────────────────────────────────────────
  // Wraps any inserted block with a red ✕ delete button on hover
  TinyEditor.prototype._wrapBlock = function (innerHtml) {
    return '<div class="tfe-block-wrap" contenteditable="false">'
      + '<button class="tfe-del-btn" contenteditable="false" title="Delete block">&#10005;</button>'
      + innerHtml
      + '</div>';
  };

  // Delete block range when using marker (handles marker node inside the range)
  TinyEditor.prototype._deleteBlockRangeFromMarker = function (range) {
    // Remove the marker first so it doesn't get in the way
    var markerParent = this._startMarker && this._startMarker.parentNode;
    if (this._startMarker && markerParent) {
      this._startMarker.remove();
      this._startMarker = null;
    }
    // Now delete the range contents
    try { range.deleteContents(); } catch(e) {}
  };

  // ── Selection watcher — activates 🗑 when text selected ─────────────────────
  TinyEditor.prototype._initSelectionWatcher = function () {
    var self = this;
    // Use a named function so it can be cleanly removed when editor is destroyed
    self._selWatcher = function () {
      // When marker is active, _highlightMarkerRange handles selection
      if (self._startMarker) return;
      // Only respond to selections inside THIS editor instance
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !self._ed || !self._ed.contains(sel.anchorNode)) {
        self._updateDeleteBtn(false);
        return;
      }
      self._updateDeleteBtn(true);
    };
    document.addEventListener('selectionchange', self._selWatcher);
  };

  // ── Mobile keyboard toolbar fix ──────────────────────────────────────────────
  // When the soft keyboard opens on mobile, the toolbar slides up out of view.
  // Fix: move the toolbar to a fixed bottom bar that follows the visual viewport.
  TinyEditor.prototype._initMobileToolbar = function () {
    var self = this;
    var tb = this._wrap && this._wrap.querySelector('.tfe-toolbar');
    if (!tb) return;

    // Only activate on touch devices
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch) return;

    // Hide toolbar if showToolbar is false or editor is readonly
    if (!self.opts.showToolbar) return;

    // Keep toolbar INSIDE the wrap — just add fixed positioning via CSS class
    // This preserves DOM isolation — toolbar never leaves the editor's subtree
    tb.classList.add('tfe-toolbar-bottom');
    this._tb = tb;

    // Always show toolbar immediately — don't wait for focus
    tb.classList.add('tfe-tb-visible');

    var showToolbar = function() {
      tb.classList.add('tfe-tb-visible');
    };

    // Use visualViewport to reposition toolbar above keyboard
    if (window.visualViewport) {
      var vv = window.visualViewport;

      var onViewportChange = function() {
        var vvHeight = window.visualViewport.height;
        var vvOffset = window.visualViewport.offsetTop || 0;
        var winHeight = window.innerHeight;
        var keyboardOpen = vvHeight < winHeight * 0.85;
        if (keyboardOpen) {
          var kbHeight = winHeight - vvHeight - vvOffset;
          tb.style.bottom = Math.max(0, kbHeight) + 'px';
        } else {
          tb.style.bottom = '0';
        }
        showToolbar(); // always visible
      };

      vv.addEventListener('resize', onViewportChange);
      vv.addEventListener('scroll', onViewportChange);
      self._vvListener = onViewportChange;
    }

    // Cleanup on destroy
    self._cleanupMobileToolbar = function() {
      if (self._vvListener && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', self._vvListener);
        window.visualViewport.removeEventListener('scroll', self._vvListener);
      }
      // Toolbar stays in wrap DOM — just hide it
      tb.classList.remove('tfe-tb-visible');
      tb.classList.remove('tfe-toolbar-bottom');
    };
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
    self._wrap.appendChild(btn); // stay in wrap, not body
    this._selDelBtn = btn;

    // Show/hide on selection change
    document.addEventListener('selectionchange', function() {
      // Only respond to selections inside THIS editor
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !self._ed || !self._ed.contains(sel.anchorNode)) {
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
    // Don't add delete buttons if toolbar is hidden (readonly/display mode)
    if (!self.opts.showToolbar) return;
    // Store observer so it can be disconnected if needed
    if (this._lineDelObserver) this._lineDelObserver.disconnect();
    this._lineDelObserver = new MutationObserver(function() {
      if (!self._lineDelSyncing) self._scheduleLineDelSync();
    });
    this._lineDelObserver.observe(this._ed, {childList:true, subtree:false});
    this._syncLineDelButtons();
  };

  TinyEditor.prototype._scheduleLineDelSync = function () {
    var self = this;
    if (!self._ed || !self.opts.showToolbar) return;
    if (self._ed.innerHTML.indexOf('tfe-md-group') === -1) return;
    if (self._lineDelSyncPending) return;
    self._lineDelSyncPending = true;
    var run = function() {
      self._lineDelSyncPending = false;
      self._syncLineDelButtons();
    };
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(run);
    else setTimeout(run, 16);
  };

  TinyEditor.prototype._syncLineDelButtons = function () {
    var self = this;
    if (self._lineDelSyncing) return;
    self._lineDelSyncing = true;
    if (this._ed.innerHTML.indexOf('tfe-md-group') === -1) {
      self._lineDelSyncing = false;
      return;
    }

    // ── Two-level delete structure ─────────────────────────────────────────
    // Level 1: the md-group itself has a group-del button (already added by _wrapMdGroup)
    // Level 2: top-level "section" blocks inside md-group get a ✕ del button
    //   → ul, ol (the whole list), blockquote, pre/code (via tfe-block-wrap), table (via tfe-block-wrap)
    //   → headings (h1-h4) — these are section dividers, worth individual delete
    //   → NOT: plain p, NOT: individual li (delete the whole ul instead)
    //   → NOT: anything outside a md-group
    // tfe-block-wrap blocks (pre, table, img, video) already have their own ✕ — skip those

    // Only target headings, ul, ol, blockquote directly inside a .tfe-md-group
    var groups = this._ed.querySelectorAll('.tfe-md-group');
    groups.forEach(function(group) {
      Array.from(group.children).forEach(function(block) {
        // Skip the group-del button itself
        if (block.classList.contains('tfe-md-group-del')) return;
        // Skip tfe-block-wrap — they have own ✕
        if (block.classList.contains('tfe-block-wrap')) return;
        // Skip empty blocks — O(1) fast check
        if (!block.textContent.trim()) return;
        // Only add to headings, ul, ol, blockquote — NOT plain p
        var tag = block.tagName ? block.tagName.toLowerCase() : '';
        var isSection = (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' ||
                         tag === 'ul' || tag === 'ol' || tag === 'blockquote');
        if (!isSection) return;
        // Already has one — O(1) check: line-del is always firstChild
        if (block.firstChild && block.firstChild.classList &&
            block.firstChild.classList.contains('tfe-line-del')) return;
      var btn = document.createElement('button');
      btn.className = 'tfe-line-del';
      btn.title = 'Delete line';
      btn.textContent = '✕';
      btn.contentEditable = 'false';
      block.insertBefore(btn, block.firstChild);
      });  // end Array.from(group.children)
    });    // end groups.forEach
    self._lineDelSyncing = false;
  };

  // ── Wrap MD import in deletable group ─────────────────────────────────────
  TinyEditor.prototype._wrapMdGroup = function (html) {
    return '<div class="tfe-md-group" contenteditable="true">'
      + '<button class="tfe-md-group-del" contenteditable="false" title="Delete entire import">&#10005;</button>'
      + html + '</div>';
  };

  // ── Auto URL detection ─────────────────────────────────────────────────────
  TinyEditor.prototype._detectUrls = function () {
    const ed = this._ed;
    if (ed.innerHTML.indexOf('http') === -1) return;
    const urlRe = /https?:\/\/[^\s<>"]+/g;
    const walker = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement &&
          node.parentElement.tagName !== 'A' &&
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
    delBtn.contentEditable = 'false';
    delBtn.innerHTML = '&#10005;';
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
  // ── PDF.js viewer ────────────────────────────────────────────────────────────
  var PDFJS_CDN = _assetUrl('pdfjs/pdf.min.js');
  var PDFJS_WORKER = _assetUrl('pdfjs/pdf.worker.min.js');
  var _pdfJsLoading = false;
  var _pdfJsCallbacks = [];

  function _preloadAsset(url, asType) {
    if (!url || !document.head || document.querySelector('link[data-tfe-preload="' + url + '"]')) return;
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = asType || 'script';
    link.href = url;
    link.setAttribute('data-tfe-preload', url);
    document.head.appendChild(link);
  }

  // Load PDF.js once, lazily
  TinyEditor.prototype._loadPdfJs = function (cb) {
    if (window.pdfjsLib) { cb(null, window.pdfjsLib); return; }
    _pdfJsCallbacks.push(cb);
    if (_pdfJsLoading) return;
    _pdfJsLoading = true;
    var script = document.createElement('script');
    script.src = PDFJS_CDN;
    script.onload = function() {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      _pdfJsLoading = false;
      var callbacks = _pdfJsCallbacks.splice(0);
      callbacks.forEach(function(fn) { fn(null, window.pdfjsLib); });
    };
    script.onerror = function() {
      _pdfJsLoading = false;
      var callbacks = _pdfJsCallbacks.splice(0);
      callbacks.forEach(function(fn) { fn(new Error('Failed to load PDF.js')); });
    };
    document.head.appendChild(script);
  };

  TinyEditor.prototype._preloadPdfJs = function () {
    _preloadAsset(PDFJS_CDN, 'script');
    _preloadAsset(PDFJS_WORKER, 'script');
    this._loadPdfJs(function(){});
  };

  TinyEditor.prototype._schedulePdfJsPreload = function () {
    var self = this;
    if (self._pdfPreloadScheduled || window.pdfjsLib) return;
    self._pdfPreloadScheduled = true;
    var run = function() { self._preloadPdfJs(); };
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 1200);
    }
  };

  // Build the PDF embed HTML shell (canvases filled by _renderPdfJs after insert)
  TinyEditor.prototype._buildPdfEmbed = function (src, label) {
    var id = 'tfe-pdf-' + Date.now();
    return '<div class="tfe-block-wrap" contenteditable="false">'
      + '<button class="tfe-del-btn" contenteditable="false" title="Delete PDF">&#10005;</button>'
      + '<div class="tfe-pdf-wrap" id="' + id + '" data-pdf-src="' + _esc(src) + '" data-pdf-label="' + _esc(label||'') + '">'
      + '<div class="tfe-pdf-loading">&#128209; ' + _esc(label||'Loading PDF…') + '</div>'
      + '</div></div>';
  };

  // Render all unrendered PDF wraps in the editor using PDF.js
  TinyEditor.prototype._renderPdfJs = function (wrap) {
    var self = this;
    var src = wrap.getAttribute('data-pdf-src');
    if (!src || wrap.getAttribute('data-pdf-loaded') === '1') return;
    // Mark as loading (not loaded) — set to '1' only after first page renders
    wrap.setAttribute('data-pdf-loaded', 'pending');

    // Show inline spinner while PDF.js loads + document parses
    var spinId = wrap.id + '-pdfload';
    var spinEl = document.createElement('div');
    spinEl.id = spinId + '-spin';
    spinEl.className = 'tfe-spinner-wrap';
    spinEl.style.minHeight = '80px';
    spinEl.innerHTML =
      '<div class="tfe-spinner"></div>' +
      '<div class="tfe-spinner-msg" id="' + spinId + '-msg">Loading PDF viewer…</div>' +
      '<div class="tfe-spinner-bar-wrap"><div class="tfe-spinner-bar" id="' + spinId + '-bar"></div></div>';
    wrap.appendChild(spinEl);

    var setMsg = function(msg, pct) {
      var m = document.getElementById(spinId + '-msg'); if (m) m.textContent = msg;
      if (typeof pct === 'number') {
        var b = document.getElementById(spinId + '-bar');
        if (b) b.style.width = Math.round(pct * 100) + '%';
      }
    };

    self._loadPdfJs(function(err, pdfjsLib) {
      if (err) {
        spinEl.remove();
        wrap.innerHTML = '<div class="tfe-pdf-error">&#9888; Could not load PDF.js<br><small>' + err.message + '</small></div>';
        return;
      }

      setMsg('Loading document…', 0.2);
      var docSrc = src;
      if (/^data:application\/pdf/i.test(src)) {
        var b64 = src.split(',')[1] || '';
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        docSrc = { data: bytes, disableWorker: true };
      }
      var loadingTask = pdfjsLib.getDocument(docSrc);
      loadingTask.promise.then(function(pdf) {
        setMsg('Rendering...', 0.6);
        var totalPages = pdf.numPages;
        var currentPage = 1;
        var label = wrap.getAttribute('data-pdf-label') || src.split('/').pop().split('?')[0] || 'document.pdf';
        var allPages = self.opts.pdfPageMode === 'all' || self.opts.showAllPdfPages === true;

        spinEl.remove();
        wrap.innerHTML =
          '<div class="tfe-pdf-canvas-wrap' + (allPages ? ' tfe-pdf-canvas-wrap--all' : '') + '" id="' + wrap.id + '-pages"></div>'
          + '<div class="tfe-pdf-bar">'
          + (allPages ? '' : '<button class="tfe-pdf-btn" id="' + wrap.id + '-prev">&#8592; Prev</button>')
          + '<span id="' + wrap.id + '-info">' + _esc(label) + (allPages ? ' &nbsp;|&nbsp; ' + totalPages + ' pages' : ' &nbsp;|&nbsp; Page 1 / ' + totalPages) + '</span>'
          + (allPages ? '' : '<button class="tfe-pdf-btn" id="' + wrap.id + '-next">Next &#8594;</button>')
          + '</div>';

        var pagesEl = document.getElementById(wrap.id + '-pages');
        var infoEl  = document.getElementById(wrap.id + '-info');
        var prevBtn = document.getElementById(wrap.id + '-prev');
        var nextBtn = document.getElementById(wrap.id + '-next');

        var getWidth = function() {
          if (wrap._roWidth) return wrap._roWidth;
          var el = wrap;
          while (el && el !== document.body) {
            var w = el.getBoundingClientRect().width;
            if (w > 50) return w;
            el = el.parentElement;
          }
          return (document.getElementById('note-ro-view') &&
                   document.getElementById('note-ro-view').getBoundingClientRect().width)
              || (window.innerWidth - 32)
              || 360;
        };

        var renderCanvas = function(page, targetEl, num) {
          var containerW = getWidth();
          var availW = Math.max(200, containerW - 16);
          var viewport = page.getViewport({scale: 1});
          var scale = availW / viewport.width;
          var scaledVP = page.getViewport({scale: Math.max(0.5, Math.min(scale, 4))});
          var canvas = document.createElement('canvas');
          canvas.className = 'tfe-pdf-canvas';
          canvas.dataset.page = String(num);
          canvas.width = scaledVP.width;
          canvas.height = scaledVP.height;
          canvas.style.cssText = 'width:100%;height:auto;display:block;border-radius:4px';
          targetEl.appendChild(canvas);
          return page.render({canvasContext: canvas.getContext('2d'), viewport: scaledVP}).promise;
        };

        var renderPage = function(num) {
          currentPage = num;
          prevBtn.disabled = num <= 1;
          nextBtn.disabled = num >= totalPages;
          infoEl.textContent = label + '  |  Page ' + num + ' / ' + totalPages;
          pagesEl.innerHTML = '<div class="tfe-spinner-wrap" style="min-height:60px"><div class="tfe-spinner"></div><div class="tfe-spinner-msg">Rendering page ' + num + '...</div></div>';
          pdf.getPage(num).then(function(page) {
            var doRender = function() {
              pagesEl.innerHTML = '';
              renderCanvas(page, pagesEl, num).then(function() {
                if (num === currentPage) wrap.setAttribute('data-pdf-loaded', '1');
              }).catch(function(err) {
                if (err && err.name !== 'RenderingCancelledException') {
                  wrap.innerHTML = '<div class="tfe-pdf-error">&#9888; ' + _esc(err.message || 'Failed to render PDF') + '</div>';
                }
              });
            };
            if (getWidth() === 0) requestAnimationFrame(function() { requestAnimationFrame(doRender); });
            else doRender();
          });
        };

        var renderAllPages = function() {
          pagesEl.innerHTML = '';
          var chain = Promise.resolve();
          for (var n = 1; n <= totalPages; n++) {
            (function(pageNum) {
              chain = chain.then(function() {
                setMsg('Rendering page ' + pageNum + ' of ' + totalPages + '...', 0.6 + (pageNum / totalPages) * 0.4);
                return pdf.getPage(pageNum).then(function(page) {
                  return renderCanvas(page, pagesEl, pageNum);
                });
              });
            })(n);
          }
          chain.then(function() {
            infoEl.textContent = label + '  |  ' + totalPages + ' pages';
            wrap.setAttribute('data-pdf-loaded', '1');
          }).catch(function(err) {
            wrap.innerHTML = '<div class="tfe-pdf-error">&#9888; ' + _esc(err.message || 'Failed to render PDF') + '</div>';
          });
        };

        if (allPages) {
          renderAllPages();
        } else {
          prevBtn.onclick = function() { if (currentPage > 1) renderPage(currentPage - 1); };
          nextBtn.onclick = function() { if (currentPage < totalPages) renderPage(currentPage + 1); };
          renderPage(1);
        }

      }).catch(function(err) {
        wrap.innerHTML = '<div class="tfe-pdf-error">&#9888; ' + _esc(err.message || 'Failed to load PDF') + '</div>';
      });
    });
  };

  // Scan editor for unrendered PDFs and render them
  TinyEditor.prototype._renderAllPdfs = function () {
    var self = this;
    var wraps = this._ed.querySelectorAll('.tfe-pdf-wrap[data-pdf-src]:not([data-pdf-loaded="1"])');
    wraps.forEach(function(w) { self._renderPdfJs(w); });
  };

  // ── Import Doc Modal ─────────────────────────────────────────────────────────
  TinyEditor.prototype._openImportDocModal = function () {
    var self = this;
    var existing = document.getElementById('tfe-doc-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'tfe-doc-modal';
    modal.className = 'tfe-doc-modal';
    modal.innerHTML =
      '<div class="tfe-doc-box">'
      + '<div class="tfe-doc-title">'
      +   '<span style="display:flex;align-items:center;gap:8px">&#128196; Import Document</span>'
      +   '<button class="tfe-media-close" id="tfe-doc-close">&#10005;</button>'
      + '</div>'

      // Markdown card
      + '<div class="tfe-doc-card tfe-doc-card--md" id="tfe-doc-md">'
      +   '<div class="tfe-doc-card-icon">&#128196;</div>'
      +   '<div class="tfe-doc-card-info">'
      +     '<div class="tfe-doc-card-name">Markdown File</div>'
      +     '<div class="tfe-doc-card-desc">Import a .md file — headings, bold, tables, code blocks and lists are fully converted</div>'
      +   '</div>'
      +   '<span class="tfe-doc-card-badge">.md</span>'
      + '</div>'

      // HTML card
      + '<div class="tfe-doc-card tfe-doc-card--html" id="tfe-doc-html">'
      +   '<div class="tfe-doc-card-icon">&#127760;</div>'
      +   '<div class="tfe-doc-card-info">'
      +     '<div class="tfe-doc-card-name">HTML File</div>'
      +     '<div class="tfe-doc-card-desc">Import a .html file — scripts and event handlers are removed for safety</div>'
      +   '</div>'
      +   '<span class="tfe-doc-card-badge">.html</span>'
      + '</div>'


      + '</div>';

    document.body.appendChild(modal);

    var close = function() { modal.remove(); };
    document.getElementById('tfe-doc-close').onclick = close;
    modal.onclick = function(e) { if (e.target === modal) close(); };

    // Markdown
    document.getElementById('tfe-doc-md').onclick = function() {
      close();
      self._file_md.click();
    };

    // HTML
    document.getElementById('tfe-doc-html').onclick = function() {
      close();
      self._file_html.click();
    };

  };

  // ── Client-side compression helpers ─────────────────────────────────────────

  // Compress image to JPEG 92% quality, resize if > max dims
  TinyEditor.prototype._compressImage = function (file, callback) {
    var MAX_LONG = 1536, QUALITY = 0.92;
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var w = img.width, h = img.height;
        var longSide = w >= h ? w : h;
        if (longSide > MAX_LONG) {
          var scale = MAX_LONG / longSide;
          w = Math.round(w * scale); h = Math.round(h * scale);
        }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(function(blob) {
          if (!blob) { callback(null, file); return; }
          if (blob.size < file.size) {
            callback(blob, new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {type:'image/jpeg'}));
          } else {
            callback(null, file);
          }
        }, 'image/jpeg', QUALITY);
      };
      img.onerror = function() { callback(null, file); };
      img.src = e.target.result;
    };
    reader.onerror = function() { callback(null, file); };
    reader.readAsDataURL(file);
  };

  // Compress video using MediaRecorder re-encode at lower bitrate
  TinyEditor.prototype._compressVideo = function (file, onProgress, callback) {
    // Use Video + MediaRecorder if supported, else fall through
    if (typeof MediaRecorder === 'undefined' || typeof VideoDecoder !== 'undefined' === false) {
      // Check if MediaRecorder supports a codec
      var mimeTypes = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
      var mime = mimeTypes.find(function(m){ return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m); });
      if (!mime) { callback(null, file); return; } // no support — skip compression
    }

    var mime = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']
      .find(function(m){ return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m); });
    if (!mime) { callback(null, file); return; }

    var url = URL.createObjectURL(file);
    var video = document.createElement('video');
    video.src = url; video.muted = true; video.playsInline = true;
    video.onloadedmetadata = function() {
      var canvas = document.createElement('canvas');
      // Scale to max 720p
      var scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width  = Math.round(video.videoWidth  * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      var ctx = canvas.getContext('2d');
      var stream = canvas.captureStream(24); // 24fps
      // Add audio track if present
      var chunks = [];
      var rec;
      try {
        rec = new MediaRecorder(stream, {mimeType: mime, videoBitsPerSecond: 800000});
      } catch(e) { URL.revokeObjectURL(url); callback(null, file); return; }
      rec.ondataavailable = function(e){ if(e.data.size>0) chunks.push(e.data); };
      rec.onstop = function() {
        URL.revokeObjectURL(url);
        var blob = new Blob(chunks, {type: mime});
        var ext = mime.includes('webm') ? '.webm' : '.mp4';
        var outFile = new File([blob], file.name.replace(/\.[^.]+$/, ext), {type: mime});
        callback(blob.size < file.size ? blob : null, blob.size < file.size ? outFile : file);
      };
      // Draw video frames
      var draw = function() {
        if (video.paused || video.ended) { rec.stop(); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if(onProgress) onProgress(video.currentTime / video.duration);
        requestAnimationFrame(draw);
      };
      rec.start(100);
      video.play().then(function(){ draw(); }).catch(function(){
        rec.stop(); URL.revokeObjectURL(url); callback(null, file);
      });
    };
    video.onerror = function(){ URL.revokeObjectURL(url); callback(null, file); };
    document.body.appendChild(video);
    setTimeout(function(){ document.body.removeChild(video); }, 100);
  };

  // Compress PDF by re-rendering pages at 150dpi and re-encoding to PDF
  // Uses PDF.js to render → canvas → image data per page
  TinyEditor.prototype._compressPdf = function (file, onProgress, callback) {
    var self = this;
    self._loadPdfJs(function(err, pdfjsLib) {
      if (err) { callback(null, file); return; }
      var reader = new FileReader();
      reader.onload = function(e) {
        pdfjsLib.getDocument({data: e.target.result}).promise.then(function(pdf) {
          var totalPages = pdf.numPages;
          var pageImages = [];
          var renderPage = function(num) {
            if (num > totalPages) {
              // All pages rendered — build a minimal PDF from JPEG images
              // Since we can't write a real PDF without a lib, just return original
              // (compression via image re-encoding is the best we can do without jsPDF)
              // For now: only compress if it's a single-image PDF (scanned)
              callback(null, file);
              return;
            }
            if (onProgress) onProgress((num-1) / totalPages);
            pdf.getPage(num).then(function(page) {
              var vp = page.getViewport({scale: 1.5}); // 150dpi equivalent
              var canvas = document.createElement('canvas');
              canvas.width = vp.width; canvas.height = vp.height;
              page.render({canvasContext: canvas.getContext('2d'), viewport: vp})
                  .promise.then(function() {
                pageImages.push(canvas.toDataURL('image/jpeg', 0.7));
                renderPage(num + 1);
              });
            }).catch(function(){ callback(null, file); });
          };
          renderPage(1);
        }).catch(function(){ callback(null, file); });
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // ── Spinner helpers (used across all async operations) ──────────────────────
  TinyEditor.prototype._showSpinner = function (containerId, msg) {
    var container = document.getElementById(containerId);
    if (!container) return;
    // If already showing spinner, just update message
    var existing = container.querySelector('.tfe-spinner-wrap');
    if (existing) { this._spinnerMsg(containerId, msg); return; }
    var wrap = document.createElement('div');
    wrap.className = 'tfe-spinner-wrap';
    wrap.id = containerId + '-spin';
    wrap.innerHTML =
      '<div class="tfe-spinner"></div>' +
      '<div class="tfe-spinner-msg">' + (msg || '') + '</div>' +
      '<div class="tfe-spinner-bar-wrap"><div class="tfe-spinner-bar" id="' + containerId + '-bar"></div></div>';
    container.appendChild(wrap);
  };
  TinyEditor.prototype._hideSpinner = function (containerId) {
    var el = document.getElementById(containerId + '-spin');
    if (el) el.remove();
    // Also hide upload progress bar
    var bar = document.getElementById('tfe-upload-bar');
    var prog = document.getElementById('tfe-upload-progress');
    if (bar) bar.style.width = '0';
    if (prog) prog.style.display = 'none';
  };
  TinyEditor.prototype._spinnerMsg = function (containerId, msg, pct) {
    var msgEl = document.querySelector('#' + containerId + '-spin .tfe-spinner-msg');
    if (msgEl) msgEl.textContent = msg || '';
    if (typeof pct === 'number') {
      var barEl = document.getElementById(containerId + '-bar');
      if (barEl) barEl.style.width = Math.min(100, Math.round(pct * 100)) + '%';
    }
  };

  TinyEditor.prototype._isLinkMode = function () {
    var r = document.getElementById('tfe-mode-link');
    return !!(r && r.checked);
  };

  TinyEditor.prototype._openMediaModal = function () {
    var self = this;
    var existing = document.getElementById('tfe-media-modal');
    if (existing) existing.remove();
    this._preloadPdfJs();

    var opts = this.opts;
    var showUrl    = opts.showMediaUrl    !== false;
    var showUpload = opts.showMediaUpload !== false;
    var showFiles  = opts.showMediaFiles  !== false && !!opts.listUrl;
    var basePath   = opts.mediaBasePath || '';

    // Build cards HTML
    var urlCard = showUrl ? (
      '<div class="tfe-media-card tfe-media-card--url">'
      + '<div class="tfe-media-row">'
      + '<input class="tfe-media-input" id="tfe-mc-url" placeholder="Paste any URL..." autocomplete="off">'
      + '<button class="tfe-media-btn" id="tfe-mc-embed">Insert</button>'
      + '</div>'
      + '<div class="tfe-media-label-row tfe-media-label-row--hidden-label">'
      + '<label for="tfe-mc-url-label">Label / display name</label>'
      + '<input class="tfe-media-label-input" id="tfe-mc-url-label" placeholder="Display name (optional)" autocomplete="off">'
      + '</div>'
      /* Override buttons — hidden until auto-detect is uncertain */
      + '<div id="tfe-mc-overrides" style="display:none;gap:6px;margin-top:8px;flex-wrap:wrap">'
      + '<span style="font-size:11px;color:var(--tfe-mut,#888);width:100%;margin-bottom:2px">Insert as:</span>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-img" style="flex:1;min-width:80px">&#128444; Image</button>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-vid" style="flex:1;min-width:80px">&#127916; Video</button>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-pdf" style="flex:1;min-width:80px">&#128209; PDF</button>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-other" style="flex:1;min-width:80px">&#128279; Link</button>'
      + '</div>'
      + '</div>'
    ) : '';

    var uploadCard = showUpload ? (
      '<div class="tfe-media-card tfe-media-card--upload">'
      + '<div class="tfe-media-label-row tfe-media-label-row--hidden-label" style="margin-top:0">'
      + '<label for="tfe-mc-upload-label">Label / display name</label>'
      + '<input class="tfe-media-label-input" id="tfe-mc-upload-label" placeholder="Upload display name (optional)" autocomplete="off">'
      + '</div>'
      + '<label style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--tfe-mut,#888);cursor:pointer;padding:0 0 6px;user-select:none">'
      + '<input type="checkbox" id="tfe-mc-compress" checked style="width:14px;height:14px;accent-color:var(--tfe-acc,#4f8ef7);cursor:pointer">'
      + '&#9889; Compress</label>'
      + '<div class="tfe-media-row">'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-cam-upload">&#128247;&nbsp; Camera</button>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-img-upload">&#128444;&nbsp; Image</button>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-vid-upload">&#127916;&nbsp; Video</button>'
      + '<button class="tfe-media-btn-sec" id="tfe-mc-pdf-upload">&#128209;&nbsp; PDF</button>'
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

    var isLinkMode = function() { return self._isLinkMode(); };

    // URL insert
    if (showUrl) {
      var getUrl   = function() { return (document.getElementById('tfe-mc-url').value || '').trim(); };
      var getUrlLabel = function() { return (document.getElementById('tfe-mc-url-label')?.value || '').trim(); };
      var getUploadLabel = function() { return (document.getElementById('tfe-mc-upload-label')?.value || '').trim(); };

      // Validate label — shake + focus if empty, return false
      var requireLabel = function(inputId) {
        return true;
      };

      // Build a filename: label_YYYYMMDDHHmmssSSS.ext
      var buildFilename = function(label, origName) {
        var ext = (origName || '').split('.').pop().toLowerCase();
        if (!ext || ext.length > 5) ext = 'bin';
        var safe = label.replace(/[^a-z0-9_\-]/gi, '_').replace(/_+/g,'_').replace(/^_|_$/g,'').toLowerCase();
        var now  = new Date();
        var pad  = function(n,w){ return String(n).padStart(w,'0'); };
        var ts   = pad(now.getFullYear(),4)+pad(now.getMonth()+1,2)+pad(now.getDate(),2)+
                   pad(now.getHours(),2)+pad(now.getMinutes(),2)+pad(now.getSeconds(),2)+
                   pad(now.getMilliseconds(),3);
        return safe + '_' + ts + '.' + ext;
      };

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
        if (!requireLabel('tfe-mc-url-label')) return;
        var lbl = getUrlLabel();
        if (isLinkMode()) {
          self._ed.focus();
          document.execCommand('insertHTML', false, '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(lbl || url) + '</a> ');
          self._updateSize();
        } else {
          self._insertMediaByUrl(url, lbl);
        }
        close();
      };

      // 🖼 Force Image override
      document.getElementById('tfe-mc-img').onclick = function() {
        var url = getUrl(); if (!url) return;
        if (!requireLabel('tfe-mc-url-label')) return;
        var lbl = getUrlLabel();
        self._ed.focus();
        if (isLinkMode()) {
          document.execCommand('insertHTML', false, '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(lbl||url) + '</a> ');
        } else {
          document.execCommand('insertHTML', false,
            self._wrapBlock('<img src="' + _esc(url) + '" alt="' + _esc(lbl) + '" style="max-width:100%;border-radius:4px;display:block">') + '<p><br></p>');
        }
        self._updateSize(); close();
      };

      // 🎬 Force Video override
      document.getElementById('tfe-mc-vid').onclick = function() {
        var url = getUrl(); if (!url) return;
        if (!requireLabel('tfe-mc-url-label')) return;
        var lbl = getUrlLabel();
        self._ed.focus();
        if (isLinkMode()) {
          document.execCommand('insertHTML', false, '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(lbl||url) + '</a> ');
        } else {
          document.execCommand('insertHTML', false,
            self._wrapBlock('<video controls style="max-width:100%;border-radius:6px;display:block;background:#000" preload="metadata">'
              + '<source src="' + _esc(url) + '">Your browser does not support video.</video>') + '<p><br></p>');
        }
        self._updateSize(); close();
      };

      // 📑 Force PDF override
      if (document.getElementById('tfe-mc-pdf')) {
        document.getElementById('tfe-mc-pdf').onclick = function() {
          var url = getUrl(); if (!url) return;
          if (!requireLabel('tfe-mc-url-label')) return;
          var lbl = getUrlLabel();
          self._ed.focus();
          if (isLinkMode()) {
            document.execCommand('insertHTML', false, '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(lbl||url) + '</a> ');
          } else {
            var html = self._buildPdfEmbed(url, lbl || url.split('/').pop().split('?')[0] || 'document.pdf');
            self._insertHtmlAtCursor(html + '<p><br></p>');
            setTimeout(function() { self._renderAllPdfs(); }, 300);
          }
          self._updateSize(); close();
        };
      }

      // 🔗 Force plain link (Other)
      if (document.getElementById('tfe-mc-other')) {
        document.getElementById('tfe-mc-other').onclick = function() {
          var url = getUrl(); if (!url) return;
          if (!requireLabel('tfe-mc-url-label')) return;
          var lbl = getUrlLabel();
          self._ed.focus();
          document.execCommand('insertHTML', false,
            '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(lbl||url) + '</a> ');
          self._updateSize(); close();
        };
      }

      // Enter key → Insert
      document.getElementById('tfe-mc-url').onkeydown = function(e) {
        if (e.key === 'Enter') document.getElementById('tfe-mc-embed').click();
      };
    }

    // Upload buttons
    if (showUpload) {
      // Read compress checkbox state
      var shouldCompress = function() {
        var cb = document.getElementById('tfe-mc-compress');
        return cb ? cb.checked : true;
      };

      document.getElementById('tfe-mc-img-upload').onclick = function() {
        if (!requireLabel('tfe-mc-upload-label')) return;
        self._pendingUploadLabel = getUploadLabel();
        self._pendingUploadAsLink = isLinkMode();
        self._pendingCompress = shouldCompress();
        if (opts.uploadUrl) { self._pendingUploadClose = close; close(); }
        else { close(); }
        self._file_img.click();
      };
      document.getElementById('tfe-mc-cam-upload').onclick = function() {
        if (!requireLabel('tfe-mc-upload-label')) return;
        self._pendingUploadLabel = getUploadLabel();
        self._pendingUploadAsLink = isLinkMode();
        self._pendingCompress = shouldCompress();
        if (opts.uploadUrl) { self._pendingUploadClose = close; close(); }
        else { close(); }
        self._file_cam.click();
      };
      document.getElementById('tfe-mc-vid-upload').onclick = function() {
        if (!requireLabel('tfe-mc-upload-label')) return;
        self._pendingUploadLabel = getUploadLabel();
        self._pendingUploadAsLink = isLinkMode();
        self._pendingCompress = shouldCompress();
        if (opts.uploadUrl) { self._pendingUploadClose = close; close(); }
        else { close(); }
        self._file_vid.click();
      };
      if (document.getElementById('tfe-mc-pdf-upload')) {
        document.getElementById('tfe-mc-pdf-upload').onclick = function() {
          if (!requireLabel('tfe-mc-upload-label')) return;
          self._pendingUploadLabel = getUploadLabel();
          self._pendingCompress = shouldCompress();
          close();
          self._file_pdf.click();
        };
      }
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

    // Focus Camera button by default (not the URL field)
    setTimeout(function() {
      var camBtn = document.getElementById('tfe-mc-cam-upload');
      if (camBtn) { camBtn.focus(); camBtn.scrollIntoView({block:'nearest'}); }
    }, 50);
  };

  // ── Load files list from server ──────────────────────────────────────────
  TinyEditor.prototype._loadFilesList = function () {
    var self = this;
    var listEl = document.getElementById('tfe-files-list');
    if (!listEl || !this.opts.listUrl) return;
    // Show spinner while loading
    listEl.innerHTML = '';
    var spinId = 'tfe-files-list';
    self._showSpinner(spinId, 'Loading your files…');
    fetch(this.opts.listUrl)
      .then(function(r) { return r.json(); })
      .then(function(files) {
        self._hideSpinner(spinId);
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
          var thumbUrl = f.thumb_url || url;
          var isImage = /^image\//i.test(f.mime || '') || /\.(jpe?g|png|gif|webp|svg|bmp)(\?|$)/i.test(name);
          var preview = isImage
            ? '<img class="tfe-media-file-thumb" src="' + _esc(thumbUrl) + '" alt="" loading="lazy" decoding="async">'
            : '<div class="tfe-media-file-icon">' + icon + '</div>';

          var row = document.createElement('div');
          row.className = 'tfe-media-file-row';
          row.dataset.file = url;
          row.innerHTML = preview
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
        self._hideSpinner(spinId);
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
    var self = this;
    if (!this.opts.deleteUrl) return;
    var listEl = document.getElementById('tfe-files-list');
    var spinId = 'tfe-files-list';
    if (listEl) self._showSpinner(spinId, 'Deleting file…');
    fetch(this.opts.deleteUrl + '/' + encodeURIComponent(name), {method:'DELETE'})
      .then(function()  { self._hideSpinner(spinId); if (cb) cb(); })
      .catch(function() { self._hideSpinner(spinId); alert('Could not delete file'); });
  };

  TinyEditor.prototype._uploadFileToServer = function (file, type, asLink) {
    var self = this;
    var label = self._pendingUploadLabel || '';
    self._pendingUploadLabel = '';

    // Rename file: label_YYYYMMDDHHmmssSSS.ext
    var uploadFile = file;
    if (label) {
      var ext = file.name.split('.').pop().toLowerCase() || 'bin';
      var safe = label.replace(/[^a-z0-9_\-]/gi, '_').replace(/_+/g,'_').replace(/^_|_$/g,'').toLowerCase();
      var now  = new Date();
      var pad  = function(n,w){ return String(n).padStart(w,'0'); };
      var ts   = pad(now.getFullYear(),4)+pad(now.getMonth()+1,2)+pad(now.getDate(),2)+
                 pad(now.getHours(),2)+pad(now.getMinutes(),2)+pad(now.getSeconds(),2)+
                 pad(now.getMilliseconds(),3);
      var newName = safe + '_' + ts + '.' + ext;
      uploadFile = new File([file], newName, {type: file.type, lastModified: file.lastModified});
    }

    var fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('type', type);
    if (label) fd.append('label', label);

    // Show spinner
    var modalBox = document.querySelector('.tfe-media-box');
    if (modalBox && !modalBox.id) modalBox.id = 'tfe-media-box-spin-host';
    self._showSpinner('tfe-media-box-spin-host', 'Uploading…');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', self.opts.uploadUrl);
    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        var pct = e.loaded / e.total;
        var msgs = ['Uploading…','Almost there…','Finishing…'];
        self._spinnerMsg('tfe-media-box-spin-host',
          pct < 0.4 ? 'Uploading…' : pct < 0.8 ? 'Almost there…' : 'Finishing…', pct);
        var bar = document.getElementById('tfe-upload-bar');
        if (bar) bar.style.width = (pct*100) + '%';
      }
    };
    xhr.onload = function() {
      self._hideSpinner('tfe-media-box-spin-host');
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          var url = data.url || data.path || data.filename || '';
          if (!url) throw new Error('No URL in response');
          var displayLabel = label || uploadFile.name || url.split('/').pop();
          if (asLink) {
            self._ed.focus();
            document.execCommand('insertHTML', false, '<a href="' + _esc(url) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(displayLabel) + '</a> ');
          } else {
            self._insertMediaByUrl(url, displayLabel);
          }
          self._updateSize();
        } catch(e) {
          alert('Upload error: ' + e.message);
        }
      } else {
        alert('Upload failed: ' + xhr.status);
      }
    };
    xhr.onerror = function() { self._hideSpinner('tfe-media-box-spin-host'); alert('Upload failed'); };
    xhr.send(fd);
  };

  TinyEditor.prototype._insertMediaByUrl = function (url, label) {
    var self = this;
    this._ed.focus();
    var html = this._buildMediaHtml(url, label);
    // _buildPdfEmbed already wraps in tfe-block-wrap — don't double-wrap
    if (!html.includes('tfe-block-wrap') &&
        (html.includes('<iframe') || html.includes('<video') || html.includes('<img'))) {
      html = this._wrapBlock(html);
    }
    this._insertHtmlAtCursor(html + '<p><br></p>');
    this._updateSize();
    // Render PDF.js viewer after DOM settles
    if (html.includes('tfe-pdf-wrap')) {
      setTimeout(function() { self._renderAllPdfs(); }, 300);
    }
  };

  TinyEditor.prototype._buildMediaHtml = function (url, label) {
    var self = this;
    var u = url.trim();
    // YouTube
    var ytM = u.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]+)/);
    if (ytM) return '<div class="tfe-video-wrap" contenteditable="false"><iframe class="tfe-video-iframe" src="https://www.youtube.com/embed/' + ytM[1] + '?rel=0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>';
    // Vimeo
    var vmM = u.match(/vimeo\.com\/(\d+)/);
    if (vmM) return '<div class="tfe-video-wrap" contenteditable="false"><iframe class="tfe-video-iframe" src="https://player.vimeo.com/video/' + vmM[1] + '?badge=0&autopause=0" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen></iframe></div>';
    // Facebook video
    var fbM = u.match(/facebook\.com\/.*\/videos\/(\d+)/i) || u.match(/fb\.watch\/([\w-]+)/);
    if (fbM) return '<div class="tfe-video-wrap" contenteditable="false"><iframe class="tfe-video-iframe" src="https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(u) + '&show_text=false" allow="autoplay;clipboard-write;encrypted-media;picture-in-picture;web-share" allowfullscreen></iframe></div>';
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
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(u)) return '<video class="tfe-vid-block" controls contenteditable="false" preload="metadata"><source src="' + _esc(u) + '">Your browser does not support video.</video>';
    // Direct image file
    if (/\.(jpe?g|png|gif|webp|svg|bmp)(\?|$)/i.test(u)) return '<img class="tfe-img-block" src="' + _esc(u) + '" alt="' + _esc(label||'') + '">';
    // PDF URL — render with PDF.js viewer
    if (/\.pdf(\?|$)/i.test(u)) {
      return self._buildPdfEmbed(u, label || u.split('/').pop().split('?')[0] || 'document.pdf');
    }
    // Generic link fallback — use label if provided
    return '<a href="' + _esc(u) + '" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">' + _esc(label||u) + '</a>';
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

  // ── Quadrilateral crop modal ───────────────────────────────────────────────
  TinyEditor.prototype._cropImageModal = function (file, callback) {
    var self = this;
    var reader = new FileReader();
    reader.onerror = function () { callback(file); };
    reader.onload = function (ev) {
      var img = new Image();
      img.onerror = function () { callback(file); };
      img.onload = function () {
        try {
        var maxCropW = Math.min(600, window.innerWidth * 0.88);
        var maxCropH = Math.min(600, window.innerHeight * 0.78);
        var scale = Math.min(1, maxCropW / img.naturalWidth, maxCropH / img.naturalHeight);
        var dispW = Math.round(img.naturalWidth * scale);
        var dispH = Math.round(img.naturalHeight * scale);

        var existing = document.getElementById('tfe-crop-modal');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.id = 'tfe-crop-modal';
        overlay.className = 'tfe-modal-overlay';
        overlay.innerHTML =
          '<div class="tfe-modal-box tfe-crop-box" style="max-width:95vw;max-height:95vh">'
          + '<div class="tfe-modal-header"><span style="font-size:16px;font-weight:700">Crop Image</span></div>'
          + '<div class="tfe-crop-canvas-wrap" style="position:relative;margin:10px;overflow:hidden;cursor:crosshair;border:1px solid var(--tfe-bdr,#444);border-radius:4px;background:#fff;display:inline-block">'
          + '<canvas id="tfe-crop-canvas" width="'+dispW+'" height="'+dispH+'" style="display:block;width:'+dispW+'px;height:'+dispH+'px"></canvas>'
          + '</div>'
          + '<div class="tfe-modal-footer" style="display:flex;gap:8px;justify-content:center;padding:8px 10px 12px">'
          + '<button class="tfe-media-btn" id="tfe-crop-apply" style="flex:1;max-width:140px;background:var(--tfe-acc,#4f8ef7);color:#fff;border:none;border-radius:4px;padding:8px 16px;font-size:14px;cursor:pointer">Apply Crop</button>'
          + '<button class="tfe-media-btn" id="tfe-crop-skip" style="flex:1;max-width:140px;background:var(--tfe-bdr,#555);color:var(--tfe-txt,#eee);border:none;border-radius:4px;padding:8px 16px;font-size:14px;cursor:pointer">Full Image</button>'
          + '<button class="tfe-media-btn" id="tfe-crop-cancel" style="flex:1;max-width:140px;background:rgba(224,82,82,.2);color:#e05252;border:1px solid #e05252;border-radius:4px;padding:8px 16px;font-size:14px;cursor:pointer">Cancel</button>'
          + '</div></div>';
        document.body.appendChild(overlay);

        var canvas = document.getElementById('tfe-crop-canvas');
        var ctx = canvas.getContext('2d');
        var iw = img.naturalWidth, ih = img.naturalHeight;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, dispW, dispH);

        // Corner handles — start at 90% of image (5% inset on each side)
        var inset = 0.05;
        var corners = [
          {x: dispW * inset, y: dispH * inset},                 // 0: top-left
          {x: dispW * (1 - inset), y: dispH * inset},           // 1: top-right
          {x: dispW * (1 - inset), y: dispH * (1 - inset)},     // 2: bottom-right
          {x: dispW * inset, y: dispH * (1 - inset)}            // 3: bottom-left
        ];
        var dragIdx = -1;
        var dragOrig = null;
        var HANDLE_R = 10;
        var SIDE_PAIRS = [[0,1],[1,2],[2,3],[3,0]];
        var SIDE_HIT_R = HANDLE_R * 2.5;

        function sideMid(i) {
          var p = SIDE_PAIRS[i];
          return {x: (corners[p[0]].x + corners[p[1]].x) / 2,
                  y: (corners[p[0]].y + corners[p[1]].y) / 2};
        }

        function drawHandles() {
          ctx.clearRect(0, 0, dispW, dispH);
          ctx.drawImage(img, 0, 0, dispW, dispH);

          // Draw quadrilateral
          ctx.beginPath();
          ctx.moveTo(corners[0].x, corners[0].y);
          for (var i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
          ctx.closePath();
          ctx.strokeStyle = '#4f8ef7';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Fill outside with semi-transparent overlay
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, dispW, dispH);
          ctx.moveTo(corners[0].x, corners[0].y);
          for (var i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.fill('evenodd');
          ctx.restore();

          // Draw corner handles
          for (var j = 0; j < 4; j++) {
            var c = corners[j];
            ctx.beginPath();
            ctx.arc(c.x, c.y, HANDLE_R, 0, Math.PI * 2);
            ctx.fillStyle = '#4f8ef7';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(j + 1, c.x, c.y);
          }

          // Draw side handles — thicker bars for easy touch
          var sideLen = 80;
          for (var j = 0; j < 4; j++) {
            var p = SIDE_PAIRS[j], a = corners[p[0]], b = corners[p[1]];
            var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            var edx = b.x - a.x, edy = b.y - a.y;
            var elen = Math.sqrt(edx * edx + edy * edy);
            if (elen < 0.001) continue;
            ctx.beginPath();
            ctx.moveTo(mx - edx / elen * sideLen, my - edy / elen * sideLen);
            ctx.lineTo(mx + edx / elen * sideLen, my + edy / elen * sideLen);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 6;
            ctx.stroke();
          }
        }
        drawHandles();

        function getCanvasPos(e) {
          var rect = canvas.getBoundingClientRect();
          var touch = e.touches ? e.touches[0] : e;
          return {
            x: Math.max(0, Math.min(dispW, (touch.clientX - rect.left) * (dispW / rect.width))),
            y: Math.max(0, Math.min(dispH, (touch.clientY - rect.top) * (dispH / rect.height)))
          };
        }

        function hitTest(x, y) {
          for (var i = 0; i < 4; i++)
            if (Math.abs(x - corners[i].x) < HANDLE_R * 2 && Math.abs(y - corners[i].y) < HANDLE_R * 2) return i;
          for (var i = 0; i < 4; i++) {
            var m = sideMid(i);
            if (Math.abs(x - m.x) < SIDE_HIT_R && Math.abs(y - m.y) < SIDE_HIT_R) return 4 + i;
          }
          return -1;
        }

        function onPointerDown(e) {
          e.preventDefault();
          var pos = getCanvasPos(e);
          dragIdx = hitTest(pos.x, pos.y);
          if (dragIdx >= 4) {
            dragOrig = corners.map(function(c) { return {x: c.x, y: c.y}; });
          }
        }

        function onPointerMove(e) {
          if (dragIdx < 0) return;
          e.preventDefault();
          var pos = getCanvasPos(e);
          if (dragIdx < 4) {
            corners[dragIdx] = pos;
          } else {
            var pair = SIDE_PAIRS[dragIdx - 4];
            var a = pair[0], b = pair[1];
            var oa = dragOrig[a], ob = dragOrig[b];
            var mx = (oa.x + ob.x) / 2, my = (oa.y + ob.y) / 2;
            var edx = ob.x - oa.x, edy = ob.y - oa.y;
            var elen = Math.sqrt(edx * edx + edy * edy);
            if (elen > 0.001) {
              var nx = -edy / elen, ny = edx / elen;
              var dot = (pos.x - mx) * nx + (pos.y - my) * ny;
              corners[a].x = oa.x + dot * nx; corners[a].y = oa.y + dot * ny;
              corners[b].x = ob.x + dot * nx; corners[b].y = ob.y + dot * ny;
            }
          }
          drawHandles();
        }

        function onPointerUp() { dragIdx = -1; dragOrig = null; }

        // Mouse
        canvas.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);
        // Touch
        canvas.addEventListener('touchstart', onPointerDown, {passive: false});
        window.addEventListener('touchmove', onPointerMove, {passive: false});
        window.addEventListener('touchend', onPointerUp);

        function cleanup() {
          canvas.removeEventListener('mousedown', onPointerDown);
          window.removeEventListener('mousemove', onPointerMove);
          window.removeEventListener('mouseup', onPointerUp);
          canvas.removeEventListener('touchstart', onPointerDown);
          window.removeEventListener('touchmove', onPointerMove);
          window.removeEventListener('touchend', onPointerUp);
          var m = document.getElementById('tfe-crop-modal');
          if (m) m.remove();
        }

        function doCrop() {
          // Map display coords back to original image coords
          var inv = 1 / scale;
          var srcCorners = corners.map(function (c) {
            return {x: Math.round(c.x * inv), y: Math.round(c.y * inv)};
          });

          // Compute min bounding rect
          var xs = srcCorners.map(function (c) { return c.x; });
          var ys = srcCorners.map(function (c) { return c.y; });
          var minX = Math.min.apply(null, xs);
          var maxX = Math.max.apply(null, xs);
          var minY = Math.min.apply(null, ys);
          var maxY = Math.max.apply(null, ys);
          var bw = Math.max(1, maxX - minX);
          var bh = Math.max(1, maxY - minY);

          // Adjust corners to bounding-rect-relative coords
          var relCorners = srcCorners.map(function (c) {
            return {x: c.x - minX, y: c.y - minY};
          });

          // Render cropped result
          var outCanvas = document.createElement('canvas');
          outCanvas.width = bw;
          outCanvas.height = bh;
          var outCtx = outCanvas.getContext('2d');

          // Fill white
          outCtx.fillStyle = '#fff';
          outCtx.fillRect(0, 0, bw, bh);

          // Clip to quadrilateral
          outCtx.beginPath();
          outCtx.moveTo(relCorners[0].x, relCorners[0].y);
          for (var i = 1; i < 4; i++) outCtx.lineTo(relCorners[i].x, relCorners[i].y);
          outCtx.closePath();
          outCtx.clip();

          // Draw source image (only appears inside quadrilateral)
          outCtx.drawImage(img, minX, minY, bw, bh, 0, 0, bw, bh);

          cleanup();
          outCanvas.toBlob(function (blob) {
            if (blob) {
              var croppedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.png') || 'cropped.png', {type: 'image/png'});
              callback(croppedFile);
            } else {
              callback(file);
            }
          }, 'image/png');
        }

        document.getElementById('tfe-crop-apply').onclick = doCrop;
        document.getElementById('tfe-crop-skip').onclick = function () {
          cleanup();
          callback(file);
        };
        document.getElementById('tfe-crop-cancel').onclick = function () {
          cleanup();
          callback(null);
        };
      } catch(e) { try { document.getElementById('tfe-crop-modal')?.remove(); } catch(ex) {} callback(file); } };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ── File chosen handler ────────────────────────────────────────────────────
  TinyEditor.prototype._fileChosen = function (type, e) {
    const files = e.target.files;
    if (!files || !files.length) return;
    const self = this;
    if (type === 'img' && files.length > 1) {
      // Multiple files selected — upload each one but skip the crop modal
      // (crop only makes sense for a single carefully-framed shot).
      for (var fi = 0; fi < files.length; fi++) {
        (function(f) {
          self._fileChosenSingle(type, f, true);
        })(files[fi]);
      }
      e.target.value = '';
      return;
    }
    self._fileChosenSingle(type, files[0], false);
  };

  TinyEditor.prototype._fileChosenSingle = function (type, file, skipCrop) {
    if (!file) return;
    const self = this;
    const compress = !!self._pendingCompress;
    self._pendingCompress = false;
    const maxSize = type === 'img' ? self.opts.maxImageSize : type === 'vid' ? self.opts.maxVideoSize : self.opts.maxSize;

    // Helper: show compression progress in progress bar
    var showProgress = function(label) {
      var bar = document.getElementById('tfe-upload-bar');
      var wrap = document.getElementById('tfe-upload-progress');
      if (wrap) wrap.style.display = 'block';
      if (bar) { bar.style.width = '30%'; bar.title = label || 'Compressing…'; }
    };
    var hideProgress = function() {
      var bar = document.getElementById('tfe-upload-bar');
      var wrap = document.getElementById('tfe-upload-progress');
      if (bar) bar.style.width = '0';
      if (wrap) wrap.style.display = 'none';
    };

    // Compression pipeline: compress if enabled AND file exceeds limit
    var processFile = function(processedFile, afterFn) {
      if (processedFile.size > maxSize) {
        alert('File too large (' + (processedFile.size/1048576).toFixed(1) + 'MB). Max: ' +
          (maxSize/1048576).toFixed(0) + 'MB. Try enabling compression.');
        e.target.value = '';
        hideProgress();
        return;
      }
      afterFn(processedFile);
    };

    if (type === 'img') {
      var asLink = !!self._pendingUploadAsLink; self._pendingUploadAsLink = false;
      var doImg = function(imgFile) {
        processFile(imgFile, function(f) {
          hideProgress();
          if (self.opts.uploadUrl) { self._uploadFileToServer(f, type, asLink); e.target.value=''; return; }
          var pendingLbl = self._pendingUploadLabel || f.name || 'image';
          self._pendingUploadLabel = '';
          var reader = new FileReader();
          reader.onload = function(ev) {
            self._ed.focus();
            if (asLink) {
              document.execCommand('insertHTML',false,'<a href="'+ev.target.result+'" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">'+_esc(pendingLbl)+'</a> ');
            } else {
              document.execCommand('insertHTML',false, self._wrapBlock('<img src="'+ev.target.result+'" alt="'+_esc(pendingLbl)+'" style="max-width:100%;border-radius:4px;display:block">'));
            }
            self._updateSize();
          };
          reader.readAsDataURL(f);
          e.target.value = '';
        });
      };
      var proceedWithFile = function(f) {
        if (compress && f.size > maxSize * 0.8) {
          var boxEl = document.querySelector('.tfe-media-box');
          if (boxEl && !boxEl.id) boxEl.id = 'tfe-comp-host';
          var compHostId = (boxEl && boxEl.id) || 'tfe-comp-host';
          self._showSpinner(compHostId, 'Converting to JPEG…');
          self._spinnerMsg(compHostId, 'Converting to JPEG…', 0.1);
          self._compressImage(f, function(blob, compressed) {
            var saved = Math.round((1 - compressed.size/f.size)*100);
            self._spinnerMsg(compHostId, saved > 0 ? 'Compressed! Saved '+saved+'%' : 'Image ready', 1);
            setTimeout(function(){ self._hideSpinner(compHostId); doImg(compressed); }, 400);
          });
        } else {
          doImg(f);
        }
      };
      if (self.opts.showCrop && !skipCrop) {
        self._cropImageModal(file, proceedWithFile);
      } else {
        proceedWithFile(file);
      }
      return;
    }

    if (type === 'vid') {
      var asLinkV = !!self._pendingUploadAsLink; self._pendingUploadAsLink = false;
      var doVid = function(vidFile) {
        processFile(vidFile, function(f) {
          hideProgress();
          if (self.opts.uploadUrl) { self._uploadFileToServer(f, type, asLinkV); e.target.value=''; return; }
          var pendingLblV = self._pendingUploadLabel || f.name || 'video';
          self._pendingUploadLabel = '';
          var reader = new FileReader();
          reader.onload = function(ev) {
            self._ed.focus();
            if (asLinkV) {
              document.execCommand('insertHTML',false,'<a href="'+ev.target.result+'" target="_blank" style="color:var(--tfe-acc,#4f8ef7)">'+_esc(pendingLblV)+'</a> ');
            } else {
              document.execCommand('insertHTML',false, self._wrapBlock('<video class="tfe-vid-block" controls preload="metadata" title="'+_esc(pendingLblV)+'"><source src="'+ev.target.result+'" type="'+f.type+'">Your browser does not support video.</video>'));
            }
            self._updateSize();
          };
          reader.readAsDataURL(f);
          e.target.value = '';
        });
      };
      if (compress && file.size > maxSize * 0.8) {
        var vboxEl = document.querySelector('.tfe-media-box');
        if (vboxEl && !vboxEl.id) vboxEl.id = 'tfe-vcomp-host';
        var vHostId = (vboxEl && vboxEl.id) || 'tfe-vcomp-host';
        self._showSpinner(vHostId, 'Compressing video…');
        var vMsgs = ['Analysing frames…','Re-encoding…','Optimising…','Finishing…'];
        self._compressVideo(file, function(pct){
          self._spinnerMsg(vHostId, vMsgs[Math.min(Math.floor(pct*4), vMsgs.length-1)], pct);
        }, function(blob, compressed) {
          var saved = Math.round((1 - compressed.size/file.size)*100);
          self._spinnerMsg(vHostId, saved > 0 ? 'Done! Saved '+saved+'%' : 'Video ready', 1);
          setTimeout(function(){ self._hideSpinner(vHostId); doVid(compressed); }, 400);
        });
      } else {
        doVid(file);
      }
      return;
    }

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
      reader.onload = function (ev) {
        var mdHtml = self._mdToHtml(ev.target.result);
        self._insertHtmlAtCursor(self._wrapMdGroup(mdHtml));
        self._updateSize();
        self._scheduleLineDelSync();
      };
      reader.readAsText(file);
    } else if (type === 'html') {
      reader.onload = function (ev) {
        var cleanHtml = self._sanitizeHtml(ev.target.result);
        self._insertHtmlAtCursor(self._wrapMdGroup(cleanHtml));
        self._updateSize();
        self._scheduleLineDelSync();
      };
      reader.readAsText(file);
    } else if (type === 'pdf') {
      // If server upload configured, upload PDF and get a real persistent URL
      if (self.opts.uploadUrl) {
        self._uploadFileToServer(file, type, false);
        e.target.value = '';
        return;
      }
      // Local fallback: blob URL (session-only — PDF won't persist after page reload)
      reader.onload = function (ev) {
        var pdfLabel = self._pendingUploadLabel || file.name || 'document.pdf';
        self._pendingUploadLabel = '';
        var html = self._buildPdfEmbed(ev.target.result, pdfLabel);
        self._insertHtmlAtCursor(html);
        self._updateSize();
        setTimeout(function() {
          var wrap = self._ed.querySelector('.tfe-pdf-wrap:not([data-pdf-loaded])');
          if (wrap) self._renderPdfJs(wrap);
        }, 300);
      };
      reader.readAsDataURL(file);
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
    self._markValueDirty();
    self._scheduleLineDelSync();
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
        + '<button class="tfe-del-btn" contenteditable="false" title="Delete block">&#10005;</button>'
        + blockHtml + '</div>';
      blocks.push(html);
      return '\x00CODE' + (blocks.length-1) + '\x00';
    });

    // Step 2: Tables
    md = md.replace(/^(\|.+\|)\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm, function(m, header, rows) {
      // Fast cell split: slice off leading/trailing | then split
      var ths = header.replace(/^\|(.+)\|\s*$/,'$1').split('|').map(c=>'<th style="'+TH_STYLE+'">'+c.trim()+'</th>').join('');
      var trs = rows.trim().split('\n').map(function(row) {
        var tds = row.replace(/^\|(.+)\|\s*$/,'$1').split('|').map(c=>'<td style="'+TD_STYLE+'">'+c.trim()+'</td>').join('');
        return '<tr>'+tds+'</tr>';
      }).join('');
      return '<div class="tfe-block-wrap" contenteditable="true" style="outline:none">'
        + '<button class="tfe-del-btn" contenteditable="false" title="Delete block">&#10005;</button>'
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
        + '<button class="tfe-del-btn" contenteditable="false" title="Delete">&#10005;</button>'
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
