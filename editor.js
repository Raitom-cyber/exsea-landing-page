/*!
 * EXSEA in-page editor v2
 * Activated only when URL has ?edit=ON
 * Edits prices, text, and link URLs, then commits to GitHub via Contents API.
 * See EDITING.md for usage.
 */
(function () {
  const url = new URL(location.href);
  if (url.searchParams.get('edit') !== 'ON') return;

  const REPO_OWNER = 'Raitom-cyber';
  const REPO_NAME  = 'exsea-landing-page';
  const FILE_PATH  = 'index.html';
  const BRANCH     = 'main';
  const TOKEN_KEY  = 'exsea_gh_pat';

  /** @type {Map<string, object>} */
  const changes = new Map();
  let uid = 0;
  let linkMode = false;

  const INLINE_TAGS = new Set(['EM','STRONG','SMALL','SPAN','BR','B','I','U','SUP','SUB','Q','MARK']);

  // ---------- styles ----------
  const style = document.createElement('style');
  style.textContent = `
  .edit-bar{position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(90deg,#e94560,#f5c518);color:#000;padding:8px 14px;font-family:Inter,sans-serif;font-size:12px;font-weight:700;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 12px rgba(0,0,0,.3);flex-wrap:wrap;gap:8px}
  .edit-bar .lg{font-weight:900;letter-spacing:1px}
  .edit-bar .actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
  .edit-bar button{background:#000;color:#fff;border:none;padding:6px 10px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:.3px;white-space:nowrap}
  .edit-bar button:hover{background:#222}
  .edit-bar button.on{background:#4a9eff}
  .edit-bar .save-btn{background:#25D366}
  .edit-bar .save-btn:hover{background:#1aa852}
  .edit-bar .save-btn:disabled{background:#888;cursor:not-allowed}
  .edit-bar .cnt{background:rgba(0,0,0,.2);padding:2px 8px;border-radius:10px;font-weight:900;font-size:11px}
  body.edit-mode{padding-top:46px !important}
  body.edit-mode .pr[data-price]{outline:2px dashed #f5c518;outline-offset:3px;cursor:pointer;border-radius:4px;position:relative}
  body.edit-mode .pr[data-price]:hover{outline-color:#25D366;background:rgba(37,211,102,.12)}
  body.edit-mode .pr[data-price]::after{content:'$';position:absolute;top:-12px;right:-10px;background:#f5c518;color:#000;padding:1px 6px;border-radius:50%;font-size:10px;font-weight:900;border:1px solid #000;min-width:14px;text-align:center}
  body.edit-mode [data-editable-text]{outline:1px dashed rgba(74,158,255,.55);outline-offset:2px;cursor:text;border-radius:3px;min-height:1em;transition:outline-color .15s,background .15s}
  body.edit-mode [data-editable-text]:hover{outline:2px dashed #4a9eff;background:rgba(74,158,255,.06)}
  body.edit-mode [data-editable-text]:focus{outline:2px solid #25D366;background:rgba(37,211,102,.06)}
  body.edit-mode.link-mode [data-editable-text]{outline-color:transparent;cursor:default}
  body.edit-mode.link-mode [data-editable-text]:hover{outline-color:transparent;background:transparent}
  body.edit-mode.link-mode .pr[data-price]{outline-color:transparent;cursor:default}
  body.edit-mode.link-mode .pr[data-price]::after{display:none}
  body.edit-mode.link-mode a{outline:2px dashed #4a9eff;outline-offset:2px;cursor:pointer;border-radius:3px;position:relative}
  body.edit-mode.link-mode a:hover{outline:2px solid #25D366;background:rgba(37,211,102,.08)}
  body.edit-mode.link-mode a::after{content:'\\1F517';position:absolute;top:-10px;right:-8px;background:#4a9eff;color:#fff;padding:1px 5px;border-radius:50%;font-size:10px;border:1px solid #000}
  body.edit-mode.link-mode a:hover::after{background:#25D366}
  .edit-dialog-bd{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px}
  .edit-dialog{background:#fff;color:#000;padding:22px;border-radius:12px;width:min(420px,100%);box-shadow:0 12px 40px rgba(0,0,0,.4);font-family:Inter,sans-serif;max-height:90vh;overflow-y:auto}
  .edit-dialog h3{margin:0 0 12px;font-size:15px;font-weight:800}
  .edit-dialog .hint{font-size:11px;color:#666;margin:4px 0 8px;line-height:1.5}
  .edit-dialog label{display:block;font-size:11px;color:#666;margin:10px 0 4px;font-weight:700;letter-spacing:.3px}
  .edit-dialog input,.edit-dialog textarea{width:100%;padding:10px 12px;font-size:14px;font-weight:500;border:2px solid #ddd;border-radius:6px;box-sizing:border-box;font-family:inherit}
  .edit-dialog input[type=number]{font-size:20px;font-weight:800}
  .edit-dialog textarea{font-family:'Courier New',Consolas,monospace;font-size:12px;resize:vertical}
  .edit-dialog input:focus,.edit-dialog textarea:focus{border-color:#e94560;outline:none}
  .edit-dialog .bts{display:flex;gap:8px;margin-top:14px;justify-content:flex-end}
  .edit-dialog button{padding:9px 16px;border-radius:6px;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
  .edit-dialog .pr{background:#e94560;color:#fff}
  .edit-dialog .sc{background:#eee;color:#000}
  .edit-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:12px 20px;border-radius:8px;z-index:100001;font-family:Inter,sans-serif;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.4);max-width:90vw;text-align:center;display:flex;gap:10px;align-items:center}
  .edit-toast.ok{background:#25D366}
  .edit-toast.err{background:#e94560}
  .edit-toast button{background:rgba(255,255,255,.2);color:#fff;border:none;padding:6px 12px;border-radius:4px;font-weight:700;cursor:pointer;font-size:12px}
  `;
  document.head.appendChild(style);
  document.body.classList.add('edit-mode');

  // ---------- bar ----------
  const bar = document.createElement('div');
  bar.className = 'edit-bar';
  bar.innerHTML = `
    <div class="lg">&#9998; EXSEA 編集モード</div>
    <div class="actions">
      <span class="cnt" id="edCnt">0 変更</span>
      <button id="edLinkMode" title="リンクURL編集モード">&#128279; URL編集: OFF</button>
      <button id="edTok" title="GitHub Token を設定">&#128273;</button>
      <button id="edExit" title="編集モードを終了">終了</button>
      <button class="save-btn" id="edSave" disabled>&#128190; 保存 & 公開</button>
    </div>
  `;
  document.body.prepend(bar);

  const cntEl  = document.getElementById('edCnt');
  const saveBt = document.getElementById('edSave');

  function upd() {
    cntEl.textContent = changes.size + ' 変更';
    saveBt.disabled = changes.size === 0;
  }

  // ---------- PRICE ----------
  document.querySelectorAll('.pr[data-price]').forEach(el => {
    el.addEventListener('click', e => {
      if (linkMode) return;
      e.preventDefault(); e.stopPropagation();
      openPriceDialog(el);
    });
  });

  function openPriceDialog(el) {
    const currentUsd = el.dataset.price;
    const bd = document.createElement('div');
    bd.className = 'edit-dialog-bd';
    bd.innerHTML = `
      <div class="edit-dialog">
        <h3>価格を編集（USD）</h3>
        <div class="hint">現在: $${Number(currentUsd).toLocaleString('en-US')} USD</div>
        <input type="number" id="edPrc" value="${currentUsd}" min="0" step="1" inputmode="numeric">
        <div class="bts">
          <button class="sc" id="edCancel">キャンセル</button>
          <button class="pr" id="edOk">更新</button>
        </div>
      </div>`;
    document.body.appendChild(bd);
    const inp = document.getElementById('edPrc');
    inp.focus(); inp.select();
    const close = () => bd.remove();
    document.getElementById('edCancel').onclick = close;
    bd.onclick = e => { if (e.target === bd) close(); };
    const submit = () => {
      const v = parseInt(inp.value, 10);
      if (!v || v <= 0) return;
      if (String(v) === currentUsd) { close(); return; }
      const orig = el.__origPrice || currentUsd;
      if (!el.__origPrice) el.__origPrice = currentUsd;
      const key = 'price_' + orig;
      el.dataset.price = v;
      if (window.setCurrency) window.setCurrency(window.curCurrency || 'USD');
      changes.set(key, { type: 'price', original: orig, current: String(v), element: el });
      upd();
      close();
    };
    document.getElementById('edOk').onclick = submit;
    inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
  }

  // ---------- TEXT (comprehensive) ----------
  function getEditMode(el) {
    if (!el || el.nodeType !== 1) return null;
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SVG' || tag === 'OPTION' || tag === 'SELECT') return null;
    if (el.closest('.edit-bar, .edit-dialog-bd, .edit-toast, svg')) return null;
    if (tag === 'A') return null; // anchors handled via link mode
    if (tag === 'HTML' || tag === 'HEAD' || tag === 'BODY' || tag === 'META' || tag === 'LINK' || tag === 'TITLE') return null;
    if (el.dataset && el.dataset.price !== undefined) return null; // price element
    if (el.hasAttribute('contenteditable')) return null;
    if (!el.textContent.trim()) return null;

    // Check children
    const kids = el.children;
    if (kids.length === 0) return 'plaintext-only';
    for (let i = 0; i < kids.length; i++) {
      if (!INLINE_TAGS.has(kids[i].tagName)) return null;
    }
    // Don't edit if it's too big (probably a container with just incidental inline children)
    if (el.textContent.length > 1500) return null;
    return 'true';
  }

  // Two passes so snapshots are taken before we add attributes
  const textCandidates = [];
  document.querySelectorAll('body *').forEach(el => {
    const mode = getEditMode(el);
    if (mode) textCandidates.push({ el, mode });
  });

  // Filter: keep only outermost (skip if ancestor is already editable)
  const candSet = new Set(textCandidates.map(x => x.el));
  const outermost = textCandidates.filter(({ el }) => {
    let p = el.parentElement;
    while (p) {
      if (candSet.has(p)) return false;
      p = p.parentElement;
    }
    return true;
  });

  // Register
  outermost.forEach(({ el, mode }) => registerText(el, mode));

  function registerText(el, mode) {
    el.setAttribute('contenteditable', mode);
    el.setAttribute('data-editable-text', '1');
    const key = 'text_' + (++uid);
    const originalSnapshot = mode === 'true' ? el.innerHTML : el.textContent;
    el.__editMode = mode;
    el.__editOrig = originalSnapshot;

    el.addEventListener('blur', () => {
      const current = mode === 'true' ? el.innerHTML : el.textContent;
      if (current === el.__editOrig) {
        changes.delete(key);
      } else {
        changes.set(key, {
          type: 'text',
          mode,
          original: el.__editOrig,
          current,
          element: el,
          tag: el.tagName.toLowerCase(),
          classAttr: el.className || ''
        });
      }
      upd();
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Escape') el.blur();
      if (e.key === 'Enter' && !e.shiftKey && mode === 'plaintext-only') {
        e.preventDefault();
        el.blur();
      }
    });
  }

  // ---------- LINK mode ----------
  const linkBtn = document.getElementById('edLinkMode');
  linkBtn.onclick = () => {
    linkMode = !linkMode;
    document.body.classList.toggle('link-mode', linkMode);
    linkBtn.classList.toggle('on', linkMode);
    linkBtn.textContent = (linkMode ? '\u{1F517} URL編集: ON' : '\u{1F517} URL編集: OFF');
    // Toggle contenteditable off in link mode to avoid click conflicts
    document.querySelectorAll('[data-editable-text]').forEach(el => {
      el.setAttribute('contenteditable', linkMode ? 'false' : (el.__editMode || 'plaintext-only'));
    });
    toast(linkMode ? 'リンクをクリックして URL を編集できます' : 'テキスト編集モードに戻りました', 'ok', 2500);
  };

  document.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      if (!linkMode) { e.preventDefault(); return; }
      e.preventDefault(); e.stopPropagation();
      openLinkDialog(a);
    });
  });

  function openLinkDialog(a) {
    const currentHref = a.getAttribute('href') || '';
    const origHref = a.__editOrigHref || currentHref;
    if (!a.__editOrigHref) a.__editOrigHref = currentHref;

    const hasChildren = a.children.length > 0;
    const currentLabel = a.textContent.trim();
    const origLabel = a.__editOrigLabel != null ? a.__editOrigLabel : currentLabel;
    if (a.__editOrigLabel == null) a.__editOrigLabel = currentLabel;

    const bd = document.createElement('div');
    bd.className = 'edit-dialog-bd';
    bd.innerHTML = `
      <div class="edit-dialog" style="width:min(560px,100%)">
        <h3>&#128279; リンクを編集</h3>
        <div class="hint">URL の変更はページ内の同じ URL <b>すべて</b>に一括適用されます（例: WhatsApp 番号）。</div>
        ${hasChildren
          ? `<div class="hint" style="color:#c33;margin:8px 0">※ このリンクにはアイコンなどの複雑な要素があるため、ラベルは通常のテキスト編集モードで変更してください。ここでは URL のみ変更できます。</div>`
          : `<label>ラベル（表示文字）</label><input type="text" id="edLbl" value="${escapeAttr(currentLabel)}">`}
        <label>URL / href</label>
        <textarea id="edUrl" rows="3">${escapeText(currentHref)}</textarea>
        <div class="bts">
          <button class="sc" id="edCancel">キャンセル</button>
          <button class="pr" id="edOk">更新</button>
        </div>
      </div>`;
    document.body.appendChild(bd);
    const urlIn = document.getElementById('edUrl');
    const lblIn = document.getElementById('edLbl');
    (lblIn || urlIn).focus();
    const close = () => bd.remove();
    document.getElementById('edCancel').onclick = close;
    bd.onclick = e => { if (e.target === bd) close(); };
    document.getElementById('edOk').onclick = () => {
      const newUrl = urlIn.value.trim();
      const newLabel = lblIn ? lblIn.value : null;
      if (!newUrl) return;

      let anyChange = false;
      if (newUrl !== currentHref) {
        a.setAttribute('href', newUrl);
        anyChange = true;
      }
      if (!hasChildren && newLabel != null && newLabel !== currentLabel) {
        a.textContent = newLabel;
        anyChange = true;
      }
      if (anyChange) {
        const key = 'link_' + origHref + '_' + origLabel;
        const finalUrl   = a.getAttribute('href');
        const finalLabel = a.textContent.trim();
        if (finalUrl === origHref && (hasChildren || finalLabel === origLabel)) {
          changes.delete(key); // reverted back
        } else {
          changes.set(key, {
            type: 'link',
            originalUrl:   origHref,
            currentUrl:    finalUrl,
            originalLabel: origLabel,
            currentLabel:  finalLabel,
            hasChildren,
            element: a
          });
        }
        upd();
      }
      close();
    };
  }

  // ---------- TOKEN ----------
  function getToken(force) {
    let tk = force ? null : localStorage.getItem(TOKEN_KEY);
    if (tk) return tk;
    const msg =
`GitHub Personal Access Token が必要です。

持っていない場合（1分で発行）:
1. https://github.com/settings/tokens/new?scopes=repo&description=EXSEA%20Editor を開く
2. [Generate token] をクリック
3. 表示されたトークン（ghp_xxx...）をコピー

下に貼り付け:`;
    tk = prompt(msg, localStorage.getItem(TOKEN_KEY) || '');
    if (tk && tk.trim()) {
      localStorage.setItem(TOKEN_KEY, tk.trim());
      return tk.trim();
    }
    return null;
  }
  document.getElementById('edTok').onclick = () => getToken(true);

  // ---------- EXIT ----------
  document.getElementById('edExit').onclick = () => {
    if (changes.size > 0 && !confirm(changes.size + ' 件の未保存の変更があります。本当に終了しますか？')) return;
    url.searchParams.delete('edit');
    location.href = url.toString();
  };

  // ---------- SAVE ----------
  saveBt.onclick = async () => {
    if (changes.size === 0) return;
    const token = getToken(false);
    if (!token) return;

    saveBt.disabled = true;
    const origLabel = saveBt.textContent;
    saveBt.textContent = '⏳ 取得中...';

    try {
      const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`, {
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json' }
      });
      if (!getRes.ok) {
        if (getRes.status === 401) throw new Error('トークンが無効です。🔑 ボタンから再設定してください');
        throw new Error('GET 失敗: HTTP ' + getRes.status);
      }
      const fileData = await getRes.json();

      // Decode base64 -> UTF-8
      const bin = atob(fileData.content.replace(/\n/g, ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      let html = new TextDecoder('utf-8').decode(bytes);

      // Define handlers that mutate `html` via closure
      function applyPriceChangeDirect(ch) {
        const oldAttr = `data-price="${ch.original}"`;
        const newAttr = `data-price="${ch.current}"`;
        if (!html.includes(oldAttr)) return false;
        html = html.split(oldAttr).join(newAttr);
        const oldFmt = '$' + Number(ch.original).toLocaleString('en-US');
        const newFmt = '$' + Number(ch.current).toLocaleString('en-US');
        html = html.split(newAttr + '>' + oldFmt).join(newAttr + '>' + newFmt);
        const oldEnc = encodeURIComponent(oldFmt);
        const newEnc = encodeURIComponent(newFmt);
        html = html.split(oldEnc).join(newEnc);
        return true;
      }

      function applyTextChange(ch) {
        const tag = ch.tag;
        const origEsc = escRe(ch.original);

        // Try 1: match with class attr if present
        const firstClass = (ch.classAttr || '').split(/\s+/).filter(Boolean)[0];
        if (firstClass) {
          const re = new RegExp(`(<${tag}\\b[^>]*\\bclass="[^"]*\\b${escRe(firstClass)}\\b[^"]*"[^>]*>)${origEsc}(?=</${tag}>)`, '');
          const m = html.match(re);
          if (m) {
            html = html.replace(re, m[1] + (ch.mode === 'true' ? ch.current : escHtml(ch.current)));
            return true;
          }
        }
        // Try 2: match by tag only (first occurrence)
        const re2 = new RegExp(`(<${tag}\\b[^>]*>)${origEsc}(?=</${tag}>)`, '');
        const m2 = html.match(re2);
        if (m2) {
          html = html.replace(re2, m2[1] + (ch.mode === 'true' ? ch.current : escHtml(ch.current)));
          return true;
        }
        // Try 3 (fallback): exact substring replace
        if (html.includes(ch.original)) {
          html = html.replace(ch.original, ch.mode === 'true' ? ch.current : escHtml(ch.current));
          return true;
        }
        return false;
      }

      function applyLinkChange(ch) {
        let changed = false;
        const oldUrl = ch.originalUrl;
        const newUrl = ch.currentUrl;
        const oldLbl = ch.originalLabel;
        const newLbl = ch.currentLabel;

        if (!ch.hasChildren && oldLbl !== newLbl) {
          // Replace only the specific anchor with this URL + label combo
          const re = new RegExp(`(<a\\b[^>]*href="${escRe(oldUrl)}"[^>]*>)${escRe(oldLbl)}(</a>)`, '');
          if (re.test(html)) {
            html = html.replace(re, `$1${escHtml(newLbl)}$2`);
            changed = true;
          }
        }
        if (oldUrl !== newUrl) {
          const oldAttr = `href="${oldUrl}"`;
          const newAttr = `href="${newUrl}"`;
          if (html.includes(oldAttr)) {
            html = html.split(oldAttr).join(newAttr);
            changed = true;
          }
        }
        return changed;
      }

      let applied = 0;
      const skipped = [];
      for (const [key, ch] of changes) {
        let ok = false;
        try {
          if (ch.type === 'price') ok = applyPriceChangeDirect(ch);
          else if (ch.type === 'text') ok = applyTextChange(ch);
          else if (ch.type === 'link') ok = applyLinkChange(ch);
        } catch (err) { console.error('apply error', key, err); }
        if (ok) applied++; else skipped.push(key);
      }

      if (applied === 0) throw new Error('変更を適用できませんでした。ソースが外部更新された可能性があります。ページ再読込してください');

      saveBt.textContent = '⏳ 公開中...';

      // Encode back to base64
      const utf8 = new TextEncoder().encode(html);
      let b = '';
      const CH = 0x8000;
      for (let i = 0; i < utf8.length; i += CH) {
        b += String.fromCharCode.apply(null, utf8.subarray(i, i + CH));
      }
      const contentB64 = btoa(b);

      const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'edit: update ' + applied + ' field(s) via browser editor',
          content: contentB64,
          sha: fileData.sha,
          branch: BRANCH
        })
      });
      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        throw new Error('PUT ' + putRes.status + ' ' + (err.message || ''));
      }

      changes.clear();
      upd();
      const skipMsg = skipped.length ? `（${skipped.length} 件スキップ）` : '';
      toastWithReload('✅ 保存完了！GitHub Pages が 1〜2 分で反映します ' + skipMsg);
    } catch (err) {
      console.error(err);
      toast('❌ ' + err.message, 'err', 10000);
    } finally {
      saveBt.disabled = changes.size === 0;
      saveBt.textContent = origLabel;
    }
  };

  // ---------- utils ----------
  function escRe(s)   { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function escapeAttr(s){ return escAttr(s); }
  function escapeText(s){ return escHtml(s); }

  function toast(msg, cls, dur) {
    const t = document.createElement('div');
    t.className = 'edit-toast ' + (cls || '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), dur || 3000);
  }
  function toastWithReload(msg) {
    const t = document.createElement('div');
    t.className = 'edit-toast ok';
    t.innerHTML = `<span>${msg}</span>`;
    const btn = document.createElement('button');
    btn.textContent = '再読込';
    btn.onclick = () => location.reload();
    t.appendChild(btn);
    document.body.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.remove(); }, 12000);
  }

  upd();
  setTimeout(() => toast('編集モード ON — 文字を直接クリック、価格は $マーク、リンクは 🔗 ボタンから', 'ok', 5000), 400);
})();
