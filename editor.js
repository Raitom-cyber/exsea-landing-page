/*!
 * EXSEA in-page editor
 * Activated only when URL has ?edit=ON
 * Commits changes directly to GitHub via Contents API.
 * See SHARE.md / EDITING.md for usage.
 */
(function () {
  const url = new URL(location.href);
  if (url.searchParams.get('edit') !== 'ON') return;

  const REPO_OWNER = 'Raitom-cyber';
  const REPO_NAME  = 'exsea-landing-page';
  const FILE_PATH  = 'index.html';
  const BRANCH     = 'main';
  const TOKEN_KEY  = 'exsea_gh_pat';

  /** Map<key, { type, original, current, element, anchor }> */
  const changes = new Map();

  // ---------- styles ----------
  const style = document.createElement('style');
  style.textContent = `
  .edit-bar{position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(90deg,#e94560,#f5c518);color:#000;padding:8px 14px;font-family:Inter,sans-serif;font-size:12px;font-weight:700;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 12px rgba(0,0,0,.3)}
  .edit-bar .lg{font-weight:900;letter-spacing:1px}
  .edit-bar .actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .edit-bar button{background:#000;color:#fff;border:none;padding:6px 12px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:.3px}
  .edit-bar button:hover{background:#222}
  .edit-bar .save-btn{background:#25D366}
  .edit-bar .save-btn:hover{background:#1aa852}
  .edit-bar .save-btn:disabled{background:#888;cursor:not-allowed}
  .edit-bar .cnt{background:rgba(0,0,0,.18);padding:2px 8px;border-radius:10px;font-weight:900}
  body.edit-mode{padding-top:42px !important}
  body.edit-mode .pr[data-price]{outline:2px dashed #f5c518;outline-offset:3px;cursor:pointer;border-radius:4px;position:relative}
  body.edit-mode .pr[data-price]:hover{outline-color:#25D366;background:rgba(37,211,102,.12)}
  body.edit-mode .pr[data-price]::after{content:'✎';position:absolute;top:-12px;right:-10px;background:#f5c518;color:#000;padding:1px 6px;border-radius:50%;font-size:11px;font-weight:900;border:1px solid #000}
  body.edit-mode [data-editable-text]{outline:2px dashed #4a9eff;outline-offset:3px;cursor:text;border-radius:4px;min-height:1.2em}
  body.edit-mode [data-editable-text]:hover{outline-color:#25D366}
  body.edit-mode [data-editable-text]:focus{outline-color:#25D366;background:rgba(37,211,102,.08);outline-style:solid}
  .edit-dialog-bd{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px}
  .edit-dialog{background:#fff;color:#000;padding:22px;border-radius:12px;width:min(380px,100%);box-shadow:0 12px 40px rgba(0,0,0,.4);font-family:Inter,sans-serif}
  .edit-dialog h3{margin:0 0 12px;font-size:15px;font-weight:800}
  .edit-dialog .hint{font-size:11px;color:#666;margin-bottom:8px}
  .edit-dialog input{width:100%;padding:12px 14px;font-size:20px;font-weight:800;border:2px solid #ddd;border-radius:6px;box-sizing:border-box;font-family:inherit}
  .edit-dialog input:focus{border-color:#e94560;outline:none}
  .edit-dialog .bts{display:flex;gap:8px;margin-top:14px;justify-content:flex-end}
  .edit-dialog button{padding:9px 16px;border-radius:6px;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
  .edit-dialog .pr{background:#e94560;color:#fff}
  .edit-dialog .sc{background:#eee;color:#000}
  .edit-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:12px 20px;border-radius:8px;z-index:100001;font-family:Inter,sans-serif;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.4);max-width:90vw;text-align:center}
  .edit-toast.ok{background:#25D366}
  .edit-toast.err{background:#e94560}
  `;
  document.head.appendChild(style);
  document.body.classList.add('edit-mode');

  // ---------- bar ----------
  const bar = document.createElement('div');
  bar.className = 'edit-bar';
  bar.innerHTML = `
    <div class="lg">✎ EXSEA 編集モード</div>
    <div class="actions">
      <span class="cnt" id="edCnt">0 変更</span>
      <button id="edTok" title="GitHub Token 設定/再設定">🔑 Token</button>
      <button id="edExit">終了</button>
      <button class="save-btn" id="edSave" disabled>💾 保存 & 公開</button>
    </div>
  `;
  document.body.prepend(bar);

  const cntEl  = document.getElementById('edCnt');
  const saveBt = document.getElementById('edSave');

  function upd() {
    cntEl.textContent = changes.size + ' 変更';
    saveBt.disabled = changes.size === 0;
  }

  // ---------- PRICE editing ----------
  document.querySelectorAll('.pr[data-price]').forEach(el => {
    el.addEventListener('click', e => {
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
      const key = 'price_' + (el.__origPrice || currentUsd);
      if (!el.__origPrice) el.__origPrice = currentUsd;
      el.dataset.price = v;
      if (window.setCurrency) window.setCurrency(window.curCurrency || 'USD');
      changes.set(key, { type: 'price', original: el.__origPrice, current: String(v), element: el });
      upd();
      close();
    };
    document.getElementById('edOk').onclick = submit;
    inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
  }

  // ---------- TEXT editing ----------
  // Explicit markers
  document.querySelectorAll('[data-edit-text]').forEach(el => {
    registerTextEl(el, { type: 'attr', key: el.dataset.editText });
  });
  // Auto: stock card names + specs
  document.querySelectorAll('.scard .nm').forEach(el => {
    registerTextEl(el, { type: 'wrap', open: '<div class="nm">', original: el.textContent });
  });
  document.querySelectorAll('.scard .gr').forEach(el => {
    registerTextEl(el, { type: 'wrap', open: '<div class="gr">', original: el.textContent });
  });
  // Auto: hero h1, category descriptions, category stat numbers, reviews
  (function autoMark(){
    const add = (selector, anchor) => document.querySelectorAll(selector).forEach(el => registerTextEl(el, anchor));
    document.querySelectorAll('.hero h1').forEach(el => registerTextEl(el, { type: 'raw', tag: 'h1', original: el.innerHTML }));
    document.querySelectorAll('.cat-desc').forEach(el => registerTextEl(el, { type: 'wrap', open: '<div class="cat-desc">', original: el.innerHTML }));
    document.querySelectorAll('.cat-stat b').forEach(el => registerTextEl(el, { type: 'wrap', open: '<div class="cat-stat"><b>', original: el.textContent }));
    document.querySelectorAll('.rev-body, blockquote.rev-text').forEach(el => registerTextEl(el, { type: 'raw', tag: 'blockquote', original: el.innerHTML }));
  })();

  let textCounter = 0;
  function registerTextEl(el, anchor) {
    if (el.__edRegistered) return;
    el.__edRegistered = true;
    el.setAttribute('contenteditable', 'plaintext-only');
    el.setAttribute('data-editable-text', '1');
    const key = 'text_' + (++textCounter);
    const original = el.textContent;
    el.addEventListener('blur', () => {
      const current = el.textContent;
      if (current === original) changes.delete(key);
      else changes.set(key, { type: 'text', original, current, element: el, anchor });
      upd();
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
    });
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
        if (getRes.status === 401) throw new Error('トークンが無効です。🔑 Token で再設定してください');
        throw new Error('GET 失敗: HTTP ' + getRes.status);
      }
      const fileData = await getRes.json();

      // Decode base64 -> UTF-8 string
      const b64raw = fileData.content.replace(/\n/g, '');
      const bin = atob(b64raw);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      let html = new TextDecoder('utf-8').decode(bytes);

      let applied = 0;
      const skipped = [];

      for (const [key, ch] of changes) {
        let ok = false;
        if (ch.type === 'price') {
          const oldAttr = `data-price="${ch.original}"`;
          const newAttr = `data-price="${ch.current}"`;
          if (html.includes(oldAttr)) {
            html = split_join(html, oldAttr, newAttr);
            // Update visible price inside: data-price="NEW">$OLD <small>
            const oldFmt = '$' + Number(ch.original).toLocaleString('en-US');
            const newFmt = '$' + Number(ch.current).toLocaleString('en-US');
            html = split_join(html, newAttr + '>' + oldFmt, newAttr + '>' + newFmt);
            // Update WhatsApp URL in same card: %24OLD%2CFOB
            const oldEnc = encodeURIComponent(oldFmt);
            const newEnc = encodeURIComponent(newFmt);
            html = split_join(html, oldEnc, newEnc);
            ok = true;
          }
        } else if (ch.type === 'text') {
          const orig = ch.original;
          const cur  = ch.current;
          const a = ch.anchor;
          if (a.type === 'attr') {
            const re = new RegExp(
              '(data-edit-text="' + escRe(a.key) + '"[^>]*>)([^<]*)',
              ''
            );
            if (re.test(html)) {
              html = html.replace(re, (_, pre) => pre + escHtml(cur));
              ok = true;
            }
          } else if (a.type === 'wrap') {
            const pat = a.open + (a.original != null ? a.original : orig);
            const rep = a.open + escHtml(cur);
            if (html.includes(pat)) {
              html = split_join(html, pat, rep);
              ok = true;
            }
          } else if (a.type === 'raw') {
            const opens = Array.from(html.matchAll(new RegExp('<' + a.tag + '\\b[^>]*>([^]*?)</' + a.tag + '>', 'g')));
            for (const m of opens) {
              if (m[1].trim() === (a.original || orig).trim()) {
                html = html.slice(0, m.index) + m[0].replace(m[1], escHtml(cur)) + html.slice(m.index + m[0].length);
                ok = true;
                break;
              }
            }
          }
        }
        if (ok) applied++; else skipped.push(key);
      }

      if (applied === 0) throw new Error('変更を適用できませんでした。ソースが外部更新された可能性があります。ページ再読込してください');

      saveBt.textContent = '⏳ 公開中...';

      // Encode UTF-8 string -> base64
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
          message: 'edit: update ' + applied + ' field(s) via in-page editor',
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
      toast('✅ 保存完了！GitHub Pages が 1〜2 分で反映します ' + skipMsg, 'ok', 7000);
    } catch (err) {
      console.error(err);
      toast('❌ ' + err.message, 'err', 10000);
    } finally {
      saveBt.disabled = changes.size === 0;
      saveBt.textContent = origLabel;
    }
  };

  // ---------- utils ----------
  function split_join(s, a, b) { return s.split(a).join(b); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function toast(msg, cls, dur) {
    const t = document.createElement('div');
    t.className = 'edit-toast ' + (cls || '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), dur || 3000);
  }

  upd();
  toast('編集モード ON — 価格はクリック、テキストは直接編集できます', 'ok', 4500);
})();
