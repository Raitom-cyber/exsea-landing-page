/*!
 * EXSEA in-page editor — ?edit=ON
 * 全文・価格（ラベル・値引き表記）・在庫/スタッフ/ヒーロー/QR 画像を編集し GitHub に保存。
 */
(function () {
  const url = new URL(location.href);
  if (url.searchParams.get('edit') !== 'ON') return;

  const REPO_OWNER = 'Raitom-cyber';
  const REPO_NAME  = 'exsea-landing-page';
  const FILE_PATH  = 'index.html';
  const BRANCH     = 'main';
  const TOKEN_KEY  = 'exsea_gh_pat';

  const changes = new Map();
  let changeSeq = 0;

  const style = document.createElement('style');
  style.textContent = `
  .edit-bar{position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(90deg,#e94560,#f5c518);color:#000;padding:8px 14px;font-family:Inter,sans-serif;font-size:12px;font-weight:700;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 12px rgba(0,0,0,.3)}
  .edit-bar .lg{font-weight:900;letter-spacing:1px;max-width:52%}
  .edit-bar .actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .edit-bar button{background:#000;color:#fff;border:none;padding:6px 12px;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer}
  .edit-bar .save-btn{background:#25D366}
  .edit-bar .save-btn:disabled{background:#888;cursor:not-allowed}
  .edit-bar .cnt{background:rgba(0,0,0,.18);padding:2px 8px;border-radius:10px;font-weight:900}
  body.edit-mode{padding-top:42px !important}
  body.edit-mode .pr[data-price],body.edit-mode .pr.pr-poa{outline:2px dashed #f5c518;outline-offset:3px;cursor:pointer;border-radius:4px;position:relative}
  body.edit-mode .pr[data-price]:hover,body.edit-mode .pr.pr-poa:hover{outline-color:#25D366;background:rgba(37,211,102,.1)}
  body.edit-mode .pr[data-price]::after,body.edit-mode .pr.pr-poa::after{content:'✎';position:absolute;top:-12px;right:-10px;background:#f5c518;color:#000;padding:1px 6px;border-radius:50%;font-size:11px;font-weight:900;border:1px solid #000}
  body.edit-mode [data-editable-text]{outline:2px dashed #4a9eff;outline-offset:3px;cursor:text;border-radius:4px;min-height:1.2em}
  body.edit-mode [data-editable-text]:hover{outline-color:#25D366}
  body.edit-mode [data-editable-text]:focus{outline-color:#25D366;background:rgba(37,211,102,.08);outline-style:solid}
  body.edit-mode .edit-img-hit{outline:3px dashed #9b59b6;outline-offset:2px;cursor:pointer;position:relative}
  body.edit-mode .edit-img-hit:hover{outline-color:#25D366}
  body.edit-mode .edit-img-hit::after{content:'🖼';position:absolute;bottom:4px;right:4px;background:#9b59b6;color:#fff;padding:2px 6px;border-radius:4px;font-size:11px;font-weight:900}
  .edit-dialog-bd{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px}
  .edit-dialog{background:#fff;color:#000;padding:22px;border-radius:12px;width:min(480px,100%);box-shadow:0 12px 40px rgba(0,0,0,.4);font-family:Inter,sans-serif}
  .edit-dialog h3{margin:0 0 12px;font-size:15px;font-weight:800}
  .edit-dialog .hint{font-size:11px;color:#666;margin-bottom:8px;line-height:1.45}
  .edit-dialog input,.edit-dialog textarea{width:100%;padding:10px 12px;font-size:14px;border:2px solid #ddd;border-radius:6px;box-sizing:border-box;font-family:inherit}
  .edit-dialog textarea{min-height:80px}
  .edit-dialog input:focus,.edit-dialog textarea:focus{border-color:#e94560;outline:none}
  .edit-dialog .bts{display:flex;gap:8px;margin-top:14px;justify-content:flex-end;flex-wrap:wrap}
  .edit-dialog button{padding:9px 16px;border-radius:6px;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
  .edit-dialog .pr{background:#e94560;color:#fff}
  .edit-dialog .sc{background:#eee;color:#000}
  .edit-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:12px 20px;border-radius:8px;z-index:100001;font-size:13px;font-weight:600;max-width:92vw;text-align:center}
  .edit-toast.ok{background:#25D366}
  .edit-toast.err{background:#e94560}
  `;
  document.head.appendChild(style);
  document.body.classList.add('edit-mode');

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="edit-bar">
      <div class="lg">✎ 編集: 紫=画像 / 黄=価格 / 青=テキスト</div>
      <div class="actions">
        <span class="cnt" id="edCnt">0</span>
        <button type="button" id="edTok">🔑 Token</button>
        <button type="button" id="edExit">終了</button>
        <button type="button" class="save-btn" id="edSave" disabled>💾 保存</button>
      </div>
    </div>`);
  const cntEl  = document.getElementById('edCnt');
  const saveBt = document.getElementById('edSave');

  function upd() {
    cntEl.textContent = changes.size + ' 変更';
    saveBt.disabled = changes.size === 0;
  }
  function newKey(p) { return p + '_' + (++changeSeq); }

  document.querySelectorAll('.scard').forEach(card => {
    card.__edOpenOriginal = card.outerHTML.match(/^<div\b[^>]*>/)[0];
  });
  document.querySelectorAll('.staff-card').forEach(card => {
    card.__edOpenOriginal = card.outerHTML.match(/^<div\b[^>]*>/)[0];
  });

  function findScardSlice(html, openTag) {
    let idx = html.indexOf(openTag);
    if (idx < 0) {
      const m = openTag.match(/data-photo="([^"]+)"/);
      if (m) {
        const needle = 'data-photo="' + m[1] + '"';
        const p = html.indexOf(needle);
        if (p >= 0) idx = html.lastIndexOf('<div class="scard', p);
      }
    }
    if (idx < 0) {
      const m = openTag.match(/data-usd="(\d+)"/);
      if (m && openTag.includes('src-card')) {
        const needle = 'data-usd="' + m[1] + '"';
        const p = html.indexOf(needle);
        if (p >= 0) idx = html.lastIndexOf('<div class="scard', p);
      }
    }
    if (idx < 0) return null;
    const next = html.indexOf('<div class="scard', idx + 1);
    const end = next > 0 ? next : html.length;
    return { start: idx, end, slice: html.slice(idx, end) };
  }

  function findStaffSlice(html, openTag) {
    let idx = html.indexOf(openTag);
    if (idx < 0) {
      const m = openTag.match(/data-photo="([^"]+)"/);
      if (m) {
        const needle = 'data-photo="' + m[1] + '"';
        const p = html.indexOf(needle);
        if (p >= 0) idx = html.lastIndexOf('<div class="staff-card', p);
      }
    }
    if (idx < 0) return null;
    const next = html.indexOf('<div class="staff-card', idx + 1);
    const end = next > 0 ? next : html.length;
    return { start: idx, end, slice: html.slice(idx, end) };
  }

  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }
  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function split_join(s, a, b) { return s.split(a).join(b); }

  function buildPriceDiv(usd, note, isPricePr) {
    const fmt = '$' + Number(usd).toLocaleString('en-US');
    const n = (note || 'FOB').trim() || 'FOB';
    const cls = isPricePr ? 'price pr' : 'pr';
    let attr = 'class="' + cls + '" data-price="' + usd + '"';
    if (n !== 'FOB') attr += ' data-price-note="' + escAttr(n) + '"';
    return '<div ' + attr + '>' + fmt + ' <small>' + escHtml(n) + '</small></div>';
  }

  function sortStockOps(list) {
    const rank = t => (t === 'stock-photo' ? 0 : (t === 'price' || t === 'poa-price') ? 1 : 2);
    list.sort((a, b) => rank(a.type) - rank(b.type));
  }

  // ---------- Prices ----------
  document.querySelectorAll('.pr[data-price]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openPriceDialog(el); });
  });
  document.querySelectorAll('.pr.pr-poa').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); openPoaDialog(el); });
  });

  function openPriceDialog(el) {
    const currentUsd = el.dataset.price;
    const curNote = (el.getAttribute('data-price-note') || (el.querySelector('small') && el.querySelector('small').textContent) || 'FOB').trim();
    const card = el.closest('.scard');
    const bd = document.createElement('div');
    bd.className = 'edit-dialog-bd';
    bd.innerHTML = `
      <div class="edit-dialog">
        <h3>価格（USD）とラベル</h3>
        <div class="hint">「FOB」を「セール」「値引き後」「was $8,000」などに変更できます。</div>
        <label class="hint" style="font-weight:800">USD</label>
        <input type="number" id="edPrc" value="${currentUsd}" min="0" step="1">
        <label class="hint" style="margin-top:10px;font-weight:800">ラベル（small）</label>
        <input type="text" id="edNote" value="${escAttr(curNote).replace(/&quot;/g, '"')}">
        <div class="bts"><button type="button" class="sc" id="edX">キャンセル</button><button type="button" class="pr" id="edOk">更新</button></div>
      </div>`;
    document.body.appendChild(bd);
    const inp = bd.querySelector('#edPrc');
    const noteInp = bd.querySelector('#edNote');
    inp.focus(); inp.select();
    const close = () => bd.remove();
    bd.querySelector('#edX').onclick = close;
    bd.onclick = e => { if (e.target === bd) close(); };
    bd.querySelector('#edOk').onclick = () => {
      const v = parseInt(inp.value, 10);
      const note = (noteInp.value || 'FOB').trim() || 'FOB';
      if (!v || v <= 0) return;
      if (!el.__origPrice) el.__origPrice = currentUsd;
      el.dataset.price = String(v);
      if (note === 'FOB') el.removeAttribute('data-price-note');
      else el.setAttribute('data-price-note', note);
      if (card) card.setAttribute('data-usd', String(v));
      if (window.setCurrency) window.setCurrency(window.curCurrency || 'USD');
      changes.set(newKey('price'), {
        type: 'price',
        originalUsd: el.__origPrice,
        currentUsd: String(v),
        note,
        cardOpenOriginal: card ? card.__edOpenOriginal : null,
        isPricePr: el.classList.contains('price')
      });
      upd();
      close();
    };
  }

  function openPoaDialog(el) {
    const card = el.closest('.scard');
    const dataUsd = card && card.dataset.usd ? card.dataset.usd : '';
    const bd = document.createElement('div');
    bd.className = 'edit-dialog-bd';
    bd.innerHTML = `
      <div class="edit-dialog">
        <h3>POA → 価格</h3>
        <input type="number" id="edPrc" value="${dataUsd}" min="0" step="100">
        <label class="hint" style="margin-top:8px;font-weight:800">ラベル</label>
        <input type="text" id="edNote" value="FOB">
        <div class="bts"><button type="button" class="sc" id="edX">キャンセル</button><button type="button" class="pr" id="edOk">設定</button></div>
      </div>`;
    document.body.appendChild(bd);
    const inp = bd.querySelector('#edPrc');
    const noteInp = bd.querySelector('#edNote');
    inp.focus();
    const close = () => bd.remove();
    bd.querySelector('#edX').onclick = close;
    bd.onclick = e => { if (e.target === bd) close(); };
    bd.querySelector('#edOk').onclick = () => {
      const v = parseInt(inp.value, 10);
      const note = (noteInp.value || 'FOB').trim() || 'FOB';
      if (!v || v <= 0 || !dataUsd || !card) return;
      el.classList.remove('pr-poa');
      el.dataset.price = String(v);
      if (note === 'FOB') el.removeAttribute('data-price-note');
      else el.setAttribute('data-price-note', note);
      el.innerHTML = '$' + Number(v).toLocaleString('en-US') + ' <small>' + escHtml(note) + '</small>';
      el.removeAttribute('contenteditable');
      el.removeAttribute('data-editable-text');
      el.__edRegistered = false;
      el.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); openPriceDialog(el); });
      card.setAttribute('data-usd', String(v));
      if (window.setCurrency) window.setCurrency(window.curCurrency || 'USD');
      changes.set(newKey('poa'), {
        type: 'poa-price',
        dataUsd,
        currentUsd: String(v),
        note,
        cardOpenOriginal: card.__edOpenOriginal
      });
      upd();
      close();
    };
  }

  function applyPriceToSlice(slice, ch) {
    const oldU = ch.originalUsd;
    const newU = ch.currentUsd;
    const note = ch.note || 'FOB';
    const oldFmt = '$' + Number(oldU).toLocaleString('en-US');
    const newFmt = '$' + Number(newU).toLocaleString('en-US');
    const isPr = ch.isPricePr;
    const re = new RegExp('<div class="' + (isPr ? 'price pr' : 'pr') + '"[^>]*data-price="' + oldU + '"[^>]*>[\\s\\S]*?<\\/div>', '');
    const rep = buildPriceDiv(newU, note, isPr);
    if (!re.test(slice)) return slice;
    let out = slice.replace(re, rep);
    out = split_join(out, encodeURIComponent(oldFmt), encodeURIComponent(newFmt));
    if (out.includes('data-usd="' + oldU + '"')) {
      out = split_join(out, 'data-usd="' + oldU + '"', 'data-usd="' + newU + '"');
    }
    return out;
  }

  function applyPoaToSlice(slice, ch) {
    const start = '<div class="scard src-card" data-cat="classic" data-usd="' + ch.dataUsd + '">';
    if (!slice.includes(start)) return slice;
    const fmt = buildPriceDiv(ch.currentUsd, ch.note || 'FOB', false);
    let out = slice.replace(start, start.replace('data-usd="' + ch.dataUsd + '"', 'data-usd="' + ch.currentUsd + '"'));
    out = out.replace(/<div class="pr pr-poa">[\s\S]*?<\/div>/, fmt);
    return out;
  }

  // ---------- Images ----------
  function openPathDialog(title, hint, current, cb) {
    const bd = document.createElement('div');
    bd.className = 'edit-dialog-bd';
    bd.innerHTML = `
      <div class="edit-dialog">
        <h3>${title}</h3>
        <div class="hint">${hint}</div>
        <textarea id="ta">${escHtml(current)}</textarea>
        <div class="bts"><button type="button" class="sc" id="x">戻る</button><button type="button" class="pr" id="ok">OK</button></div>
      </div>`;
    document.body.appendChild(bd);
    const ta = bd.querySelector('#ta');
    ta.focus();
    const close = () => bd.remove();
    bd.querySelector('#x').onclick = close;
    bd.onclick = e => { if (e.target === bd) close(); };
    bd.querySelector('#ok').onclick = () => {
      const v = ta.value.trim().replace(/\n/g, '');
      if (v) cb(v);
      close();
    };
  }

  document.querySelectorAll('.scard .thumb').forEach(thumb => {
    thumb.classList.add('edit-img-hit');
    thumb.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const card = thumb.closest('.scard');
      if (!card) return;
      const cur = card.getAttribute('data-photo') || '';
      openPathDialog('在庫カード画像', '例: photos/stock/new.png または https://...', cur, path => {
        card.setAttribute('data-photo', path);
        if (window.exseaApplyStockThumb) window.exseaApplyStockThumb(card);
        changes.set(newKey('ph'), { type: 'stock-photo', cardOpenOriginal: card.__edOpenOriginal, newPath: path });
        upd();
      });
    }, true);
  });

  document.querySelectorAll('.staff-card .staff-photo').forEach(ph => {
    ph.classList.add('edit-img-hit');
    ph.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const card = ph.closest('.staff-card');
      if (!card) return;
      const cur = card.getAttribute('data-photo') || '';
      openPathDialog('スタッフ写真', '例: photos/staff/name.jpg', cur, path => {
        card.setAttribute('data-photo', path);
        if (window.exseaApplyStaffThumb) window.exseaApplyStaffThumb(card);
        changes.set(newKey('sph'), { type: 'staff-photo', staffOpenOriginal: card.__edOpenOriginal, newPath: path });
        upd();
      });
    }, true);
  });

  const featImg = document.querySelector('.featured-img');
  let heroImgOld = '';
  if (featImg) {
    const st = featImg.getAttribute('style') || '';
    const m = st.match(/url\(['"]?([^'")]+)['"]?\)/);
    heroImgOld = m ? m[1] : '';
    featImg.classList.add('edit-img-hit');
    featImg.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      openPathDialog('ヒーロー右の画像', '', heroImgOld, path => {
        featImg.setAttribute('style', "background-image:url('" + path.replace(/'/g, '%27') + "')");
        changes.set(newKey('hi'), { type: 'hero-img', oldUrl: heroImgOld, newUrl: path });
        heroImgOld = path;
        upd();
      });
    });
  }

  document.querySelectorAll('.qr-wrap img, section.cta img').forEach(img => {
    img.classList.add('edit-img-hit');
    img.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const curFull = img.getAttribute('src') || '';
      const base = curFull.split('?')[0];
      openPathDialog('画像 src', '例: whatsapp-qr.png または URL', base, path => {
        const q = curFull.includes('?') ? curFull.slice(curFull.indexOf('?')) : '';
        const newFull = path + q;
        img.setAttribute('src', newFull);
        changes.set(newKey('im'), { type: 'img-src', oldFull: curFull, newFull });
        upd();
      });
    });
  });

  // ---------- Text ----------
  function bindText(el, anchor) {
    if (el.__edRegistered) return;
    el.__edRegistered = true;
    const rich = anchor.kind === 'globalOuter' && /<(strong|em|br|span|b)\b/i.test(el.innerHTML);
    el.setAttribute('contenteditable', rich ? 'true' : 'plaintext-only');
    el.setAttribute('data-editable-text', '1');
    const key = newKey('tx');
    const initialOuter = anchor.kind === 'globalOuter' ? el.outerHTML : null;
    const initialText = anchor.kind === 'cardField' ? el.textContent : null;
    const initialHtml = anchor.kind === 'html' ? el.innerHTML : null;
    const initialAttrText = anchor.kind === 'attr' ? anchor.initialAttrText : null;

    el.addEventListener('blur', () => {
      if (anchor.kind === 'globalOuter') {
        if (el.outerHTML === initialOuter) changes.delete(key);
        else changes.set(key, { type: 'text', kind: 'globalOuter', initialOuter, element: el });
      } else if (anchor.kind === 'cardField') {
        if (el.textContent === initialText) changes.delete(key);
        else {
          const o = { type: 'text', kind: 'cardField', field: anchor.field, cardOpenOriginal: anchor.cardOpenOriginal,
            staffOpenOriginal: anchor.staffOpenOriginal, staff: !!anchor.staff, tgIndex: anchor.tgIndex, actIndex: anchor.actIndex, element: el };
          changes.set(key, o);
        }
      } else if (anchor.kind === 'html') {
        if (el.innerHTML === initialHtml) changes.delete(key);
        else changes.set(key, { type: 'text', kind: 'html', tag: anchor.tag, initialHtml, element: el });
      } else if (anchor.kind === 'attr') {
        if (el.textContent === initialAttrText) changes.delete(key);
        else changes.set(key, { type: 'text', kind: 'attr', attrKey: anchor.attrKey, element: el });
      }
      upd();
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && anchor.kind === 'cardField') { e.preventDefault(); el.blur(); }
    });
  }

  document.querySelectorAll('[data-edit-text]').forEach(el => {
    bindText(el, { kind: 'attr', attrKey: el.dataset.editText, initialAttrText: el.textContent });
  });

  document.querySelectorAll('.scard').forEach(card => {
    const co = card.__edOpenOriginal;
    card.querySelectorAll('.nm').forEach(el => bindText(el, { kind: 'cardField', field: 'nm', cardOpenOriginal: co }));
    card.querySelectorAll('.gr').forEach(el => bindText(el, { kind: 'cardField', field: 'gr', cardOpenOriginal: co }));
    card.querySelectorAll('.thumb .t-make').forEach(el => bindText(el, { kind: 'cardField', field: 't-make', cardOpenOriginal: co }));
    card.querySelectorAll('.thumb .t-model').forEach(el => bindText(el, { kind: 'cardField', field: 't-model', cardOpenOriginal: co }));
    card.querySelectorAll('.thumb .t-year').forEach(el => bindText(el, { kind: 'cardField', field: 't-year', cardOpenOriginal: co }));
    card.querySelectorAll('.tags span').forEach(el => {
      if (!el.className.includes('tg')) return;
      const tags = el.parentElement;
      const idx = tags ? Array.prototype.indexOf.call(tags.children, el) : 0;
      bindText(el, { kind: 'cardField', field: 'tg', tgIndex: idx, cardOpenOriginal: co });
    });
    card.querySelectorAll('.act').forEach((el, i) => bindText(el, { kind: 'cardField', field: 'act', actIndex: i, cardOpenOriginal: co }));
    card.querySelectorAll('.thumb .t-badge').forEach((el, i) => bindText(el, { kind: 'cardField', field: 'badge', actIndex: i, cardOpenOriginal: co }));
  });

  document.querySelectorAll('.staff-card').forEach(card => {
    const so = card.__edOpenOriginal;
    ['staff-name', 'staff-role', 'staff-exp', 'staff-bio', 'staff-specialty', 'staff-lang'].forEach(cls => {
      const el = card.querySelector('.' + cls);
      if (el) bindText(el, { kind: 'cardField', field: cls, staff: true, staffOpenOriginal: so });
    });
  });

  const GLOBAL_SEL = [
    'nav .logo', 'nav .tag', 'nav .links a',
    '.trust-row .trust-t',
    '.hero .overline', '.hero h1', '.hero .sub',
    '.hero .nums .n',
    '.hero .cta-primary', '.hero .btn-g',
    '.hero-dealer-banner .hdb-tag', '.hero-dealer-banner .hdb-title', '.hero-dealer-banner .hdb-sub', '.hero-dealer-banner .hdb-arrow',
    '.featured-tag', '.featured-title', '.featured-sub',
    '.nile .exclusive-tag', '.nile h2', '.nile .sub-intro', '.nile h3',
    '.flow-t', '.flow-d',
    '.benefit-item span',
    '.partner-note',
    '.contrast h2', '.contrast .tag', '.contrast .them h4', '.contrast .us h4',
    '.contrast .them .big', '.contrast .them .desc', '.contrast .us .big', '.contrast .us .desc',
    '.contrast .clist li', '.contrast .ulist li',
    '.pillars h2', '.pillars .pcard h3', '.pillars .pcard p', '.pillars .proof',
    '.team h2', '.team .team-sub',
    '.cat-tag', '.cat-title', '.cat-desc',
    '.cat-stat',
    '#stock > .ctn > h2', '#stock > .ctn > p.sub',
    '.tab-bar button',
    '.curr-btn',
    '.reviews h2', '.reviews .ctn > p',
    '.rcard .qt', '.rcard .au', '.rcard .mt', '.rcard .yr',
    '#stock > .ctn > p[style*="text-align:center"]',
    '.req h2', '.req .sub', '.form-row label',
    '.form-submit button', '.form-submit p',
    '#formSuccess h3', '#formSuccess p',
    '.cta h2', '.cta .sub', '.cta .qr-label',
    '.cta .info p', '.cta a',
    'footer p'
  ].join(',');

  document.querySelectorAll(GLOBAL_SEL).forEach(el => {
    if (el.closest('.scard') || el.closest('.staff-card')) return;
    bindText(el, { kind: 'globalOuter', initialOuter: el.outerHTML });
  });

  function applyCardTextSlice(slice, ch) {
    const txt = escHtml(ch.element.textContent);
    const f = ch.field;
    if (f === 'nm') return slice.replace(/<div class="nm">[^<]*<\/div>/, '<div class="nm">' + txt + '</div>');
    if (f === 'gr') return slice.replace(/<div class="gr">[^<]*<\/div>/, '<div class="gr">' + txt + '</div>');
    if (f === 't-make') return slice.replace(/<span class="t-make">[^<]*<\/span>/, '<span class="t-make">' + txt + '</span>');
    if (f === 't-model') return slice.replace(/<span class="t-model">[^<]*<\/span>/, '<span class="t-model">' + txt + '</span>');
    if (f === 't-year') return slice.replace(/<span class="t-year">[^<]*<\/span>/, '<span class="t-year">' + txt + '</span>');
    if (f === 'tg') {
      let i = 0;
      const idx = ch.tgIndex;
      return slice.replace(/<span class="tg[^"]*">[^<]*<\/span>/g, full => (i++ === idx ? full.replace(/>[^<]*</, '>' + txt + '<') : full));
    }
    if (f === 'act') {
      let i = 0;
      return slice.replace(/<a[^>]*class="act[^"]*"[^>]*>([^<]*)<\/a>/g, (full, inner) => (i++ === ch.actIndex ? full.replace(inner, txt) : full));
    }
    if (f === 'badge') {
      let i = 0;
      return slice.replace(/<span class="t-badge[^"]*">[^<]*<\/span>/g, full => (i++ === ch.actIndex ? full.replace(/>[^<]*</, '>' + txt + '<') : full));
    }
    return slice;
  }

  function applyStaffTextSlice(slice, ch) {
    const cls = ch.field;
    const re = new RegExp('<div class="' + cls + '">[\\s\\S]*?<\\/div>');
    return slice.replace(re, '<div class="' + cls + '">' + escHtml(ch.element.textContent) + '</div>');
  }

  function mergeStock(html, openTag, list) {
    sortStockOps(list);
    const loc = findScardSlice(html, openTag);
    if (!loc) return { html, ok: false };
    let sl = loc.slice;
    let touched = false;
    for (const ch of list) {
      let n = sl;
      if (ch.type === 'stock-photo') {
        const safe = ch.newPath.replace(/"/g, '');
        n = sl.replace(/data-photo="[^"]*"/, 'data-photo="' + safe + '"');
      }
      else if (ch.type === 'price') n = applyPriceToSlice(sl, ch);
      else if (ch.type === 'poa-price') n = applyPoaToSlice(sl, ch);
      else if (ch.type === 'text' && ch.kind === 'cardField' && !ch.staff) n = applyCardTextSlice(sl, ch);
      if (n !== sl) { sl = n; touched = true; }
    }
    if (!touched) return { html, ok: false };
    return { html: html.slice(0, loc.start) + sl + html.slice(loc.end), ok: true };
  }

  function mergeStaff(html, openTag, list) {
    list.sort((a, b) => (a.type === 'staff-photo' ? -1 : 1) - (b.type === 'staff-photo' ? -1 : 1));
    const loc = findStaffSlice(html, openTag);
    if (!loc) return { html, ok: false };
    let sl = loc.slice;
    let touched = false;
    for (const ch of list) {
      let n = sl;
      if (ch.type === 'staff-photo') {
        const safe = ch.newPath.replace(/"/g, '');
        n = sl.replace(/data-photo="[^"]*"/, 'data-photo="' + safe + '"');
      }
      else if (ch.type === 'text' && ch.staff) n = applyStaffTextSlice(sl, ch);
      if (n !== sl) { sl = n; touched = true; }
    }
    if (!touched) return { html, ok: false };
    return { html: html.slice(0, loc.start) + sl + html.slice(loc.end), ok: true };
  }

  function getToken(force) {
    let tk = force ? null : localStorage.getItem(TOKEN_KEY);
    if (tk) return tk;
    tk = prompt('GitHub token (repo scope):', '');
    if (tk && tk.trim()) { localStorage.setItem(TOKEN_KEY, tk.trim()); return tk.trim(); }
    return null;
  }
  document.getElementById('edTok').onclick = () => getToken(true);
  document.getElementById('edExit').onclick = () => {
    if (changes.size && !confirm('未保存で終了しますか？')) return;
    url.searchParams.delete('edit');
    location.href = url.toString();
  };

  saveBt.onclick = async () => {
    if (!changes.size) return;
    const token = getToken(false);
    if (!token) return;
    saveBt.disabled = true;
    const orig = saveBt.textContent;
    saveBt.textContent = '⏳…';
    try {
      const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`, {
        headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github+json' }
      });
      if (!getRes.ok) throw new Error('読込失敗 ' + getRes.status);
      const fileData = await getRes.json();
      const bin = atob(fileData.content.replace(/\n/g, ''));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      let html = new TextDecoder('utf-8').decode(bytes);

      const stockMap = new Map();
      const staffMap = new Map();
      const globals = [];

      for (const ch of changes.values()) {
        if (ch.cardOpenOriginal) {
          if (!stockMap.has(ch.cardOpenOriginal)) stockMap.set(ch.cardOpenOriginal, []);
          stockMap.get(ch.cardOpenOriginal).push(ch);
        } else if (ch.staffOpenOriginal) {
          if (!staffMap.has(ch.staffOpenOriginal)) staffMap.set(ch.staffOpenOriginal, []);
          staffMap.get(ch.staffOpenOriginal).push(ch);
        } else globals.push(ch);
      }

      let applied = 0;
      for (const [op, list] of stockMap) {
        const r = mergeStock(html, op, list);
        if (r.ok) { html = r.html; applied++; }
      }
      for (const [op, list] of staffMap) {
        const r = mergeStaff(html, op, list);
        if (r.ok) { html = r.html; applied++; }
      }

      for (const ch of globals) {
        let ok = false;
        if (ch.type === 'price' && !ch.cardOpenOriginal) {
          const oldU = ch.originalUsd;
          const newU = ch.currentUsd;
          const re = new RegExp('<div class="price pr"[^>]*data-price="' + oldU + '"[^>]*>[\\s\\S]*?<\\/div>', '');
          const rep = buildPriceDiv(newU, ch.note || 'FOB', true);
          if (re.test(html)) {
            html = html.replace(re, rep);
            const oldFmt = '$' + Number(oldU).toLocaleString('en-US');
            const newFmt = '$' + Number(newU).toLocaleString('en-US');
            html = split_join(html, encodeURIComponent(oldFmt), encodeURIComponent(newFmt));
            ok = true;
          }
        } else if (ch.type === 'hero-img' && ch.oldUrl) {
          const a = "background-image:url('" + ch.oldUrl.replace(/'/g, "\\'") + "')";
          const b = "background-image:url('" + ch.newUrl.replace(/'/g, "\\'") + "')";
          if (html.includes(a)) { html = split_join(html, a, b); ok = true; }
          else if (html.includes('url(\'' + ch.oldUrl + '\')')) { html = split_join(html, 'url(\'' + ch.oldUrl + '\')', 'url(\'' + ch.newUrl + '\')'); ok = true; }
        } else if (ch.type === 'img-src' && ch.oldFull) {
          if (html.includes('src="' + ch.oldFull + '"')) { html = split_join(html, 'src="' + ch.oldFull + '"', 'src="' + ch.newFull + '"'); ok = true; }
        } else if (ch.type === 'text' && ch.kind === 'globalOuter' && html.includes(ch.initialOuter)) {
          html = html.replace(ch.initialOuter, ch.element.outerHTML);
          ok = true;
        } else if (ch.type === 'text' && ch.kind === 'html') {
          const re = new RegExp('<' + ch.tag + '\\b[^>]*>[\\s\\S]*?<\\/' + ch.tag + '>', 'm');
          const m = html.match(re);
          if (m && m[0].includes(ch.initialHtml)) {
            html = html.replace(m[0], m[0].replace(ch.initialHtml, ch.element.innerHTML));
            ok = true;
          }
        } else if (ch.type === 'text' && ch.kind === 'attr') {
          const rgx = new RegExp('(data-edit-text="' + escRe(ch.attrKey) + '"[^>]*>)([^<]*)', '');
          if (rgx.test(html)) { html = html.replace(rgx, (_, a) => a + escHtml(ch.element.textContent)); ok = true; }
        }
        if (ok) applied++;
      }

      if (!applied) throw new Error('適用できる変更がありません。再読込してください。');

      saveBt.textContent = '公開中…';
      const utf8 = new TextEncoder().encode(html);
      let b64 = '';
      const CH = 0x8000;
      for (let i = 0; i < utf8.length; i += CH) b64 += String.fromCharCode.apply(null, utf8.subarray(i, i + CH));
      const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'edit: in-page editor (' + applied + ' blocks)', content: btoa(b64), sha: fileData.sha, branch: BRANCH })
      });
      if (!putRes.ok) throw new Error('保存失敗 ' + putRes.status);
      changes.clear();
      upd();
      toast('✅ 保存しました（1〜2分で反映）', 'ok', 6000);
    } catch (e) {
      toast('❌ ' + e.message, 'err', 9000);
    } finally {
      saveBt.disabled = !changes.size;
      saveBt.textContent = orig;
    }
  };

  function toast(msg, cls, t) {
    const x = document.createElement('div');
    x.className = 'edit-toast ' + (cls || '');
    x.textContent = msg;
    document.body.appendChild(x);
    setTimeout(() => x.remove(), t || 3000);
  }

  upd();
  toast('編集モード ON', 'ok', 3500);
})();
