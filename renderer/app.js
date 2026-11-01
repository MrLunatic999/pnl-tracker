(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const api = window.api;
  const t = window.I18N.t;
  const fmtDuration = window.I18N.fmtDuration;

  const state = {
    data: null,
    market: 'crypto',
    quotes: {},
    timer: null,
    dashScope: ['all'],
    holdGroup: 'all',
    showClosedHold: false,
  };

  // ---------- helpers: active-market data ----------
  const mkt = () => state.data[state.market];
  const txs = () => mkt().transactions;
  const groups = () => mkt().groups;
  const coinGroups = () => mkt().coinGroups;
  const groupUi = () => mkt().groupUi;

  // ---------- formatting ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cleanSym = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9.]/g, '');
  function fmtPrice(v) {
    if (v == null || !Number.isFinite(v)) return '—';
    const a = Math.abs(v);
    const d = a >= 1000 ? 2 : a >= 1 ? 4 : a >= 0.01 ? 6 : 8;
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: d });
  }
  const fmtUsd = (v) => (v == null || !Number.isFinite(v) ? '—' : (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const fmtSigned = (v) => (v == null || !Number.isFinite(v) ? '—' : (v > 0 ? '+' : '') + fmtUsd(v));
  const fmtPct = (v) => (v == null || !Number.isFinite(v) ? '—' : (v > 0 ? '+' : '') + v.toFixed(2) + '%');
  const fmtQty = (v) => (v == null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: 8 }));
  const cls = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');
  const fmtDate = (ms, withTime = true) => {
    if (!ms) return '—';
    const d = new Date(ms);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` + (withTime ? ` ${p(d.getHours())}:${p(d.getMinutes())}` : '');
  };
  const toLocalInput = (ms) => { const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
  const COLORS = ['#f0b90b', '#4c8dff', '#16c784', '#a66bff', '#ff7a45', '#2ed3d3', '#ff5ca8', '#c7d23a', '#8a96ad'];
  const symColor = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; };
  const badge = (s) => `<span class="coin-badge" style="background:${symColor(s)}">${esc(s.slice(0, 3))}</span>`;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function toast(msg, err = false) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(el._h);
    el._h = setTimeout(() => (el.className = 'toast'), 3200);
  }
  function confirmBox(text) {
    return new Promise((resolve) => {
      $('#modalText').textContent = text;
      $('#modal').hidden = false;
      const done = (v) => { $('#modal').hidden = true; $('#modalOk').onclick = $('#modalCancel').onclick = null; resolve(v); };
      $('#modalOk').onclick = () => done(true);
      $('#modalCancel').onclick = () => done(false);
    });
  }
  function seg(id, onChange) {
    const root = $(id);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      root.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      onChange && onChange(b.dataset.v);
    });
    return () => root.querySelector('button.on').dataset.v;
  }

  // ---------- data ----------
  async function save() {
    await api.saveData(state.data);
    renderAll();
  }
  const priceOf = (sym) => (state.quotes[sym] ? state.quotes[sym].price : null);

  let lastStatus = null;
  function renderPriceStatus() {
    const el = $('#priceStatus');
    if (!el || !lastStatus) return;
    if (lastStatus.err != null) { el.innerHTML = `<span class="down">${esc(t('status.updateFail', { e: lastStatus.err }))}</span>`; return; }
    el.innerHTML = esc(t('status.lastUpdate', { t: lastStatus.time })) + `<br>${esc(lastStatus.src)}` + (lastStatus.warn ? `<br><span class="down">${esc(lastStatus.warn)}</span>` : '');
  }

  async function refreshQuotes() {
    const syms = [...new Set(txs().map((t) => t.symbol))];
    if (!syms.length) { lastStatus = null; $('#priceStatus').textContent = t('status.noCoins'); return; }
    $('#priceStatus').textContent = t('status.updating');
    try {
      const fetcher = state.market === 'crypto' ? api.cryptoQuotes : api.stockQuotes;
      const { quotes, errors } = await fetcher(syms);
      Object.assign(state.quotes, quotes);
      const src = [...new Set(Object.values(quotes).map((q) => q.source))].join(' + ');
      lastStatus = { time: fmtDate(Date.now()).slice(11), src, warn: errors.length ? errors[0] : '' };
    } catch (e) {
      lastStatus = { err: e.message };
    }
    renderPriceStatus();
    renderAll(false);
  }
  function startTimer() {
    clearInterval(state.timer);
    const s = Math.max(15, +state.data.settings.refreshSeconds || 60);
    state.timer = setInterval(refreshQuotes, s * 1000);
  }

  // ---------- market switching ----------
  $('#marketTabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-market]');
    if (!b || b.dataset.market === state.market) return;
    state.market = b.dataset.market;
    $$('#marketTabs button').forEach((x) => x.classList.toggle('on', x === b));
    state.quotes = {};
    state.dashScope = ['all'];
    state.holdGroup = 'all';
    renderAll();
    refreshQuotes();
  });

  // ---------- navigation ----------
  let current = 'dashboard';
  function go(name) {
    current = name;
    $$('#nav button').forEach((b) => b.classList.toggle('active', b.dataset.section === name));
    $$('.section').forEach((s) => s.classList.toggle('active', s.id === 'sec-' + name));
  }
  $('#nav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) go(b.dataset.section); });

  // ---------- groups ----------
  const UNGROUPED = '__ungrouped__';
  const groupOf = (sym) => (coinGroups()[sym] && groups().some((g) => g.id === coinGroups()[sym]) ? coinGroups()[sym] : UNGROUPED);
  const groupName = (gid) => (gid === UNGROUPED ? t('group.ungrouped') : (groups().find((g) => g.id === gid) || {}).name || '—');
  const groupColor = (gid) => (gid === UNGROUPED ? '#8a96ad' : (groups().find((g) => g.id === gid) || {}).color || '#8a96ad');

  const isAllScope = () => { const sc = state.dashScope; return !sc || !sc.length || sc.includes('all'); };
  const inScope = (gid) => !isAllScope() && state.dashScope.includes(gid);
  function scopeSet() {
    if (isAllScope()) return null;
    const set = new Set();
    for (const tx of txs()) if (state.dashScope.includes(groupOf(tx.symbol))) set.add(tx.symbol);
    return set;
  }

  // ---------- summary ----------
  function summary(symFilter) {
    const pos = Calc.positions(txs());
    let value = 0, cost = 0, realized = 0, change24 = 0, priced = true;
    for (const p of Object.values(pos)) {
      if (symFilter && !symFilter.has(p.symbol)) continue;
      realized += p.realized;
      if (p.qty <= 0) continue;
      const px = priceOf(p.symbol);
      if (px == null) { priced = false; continue; }
      const v = p.qty * px;
      value += v;
      cost += p.cost;
      const ch = state.quotes[p.symbol] && state.quotes[p.symbol].change24h;
      if (Number.isFinite(ch)) change24 += v - v / (1 + ch / 100);
    }
    return { pos, value, cost, unrealized: value - cost, realized, total: value - cost + realized, change24, priced };
  }

  function renderAll(full = true) {
    renderWalletTotal();
    renderHoldings();
    renderSymbolLists(summary());
    renderHistory();
    renderScopeBar();
    const scoped = summary(scopeSet());
    renderKpis(scoped);
    renderAllocation(scopeSet());
    renderPfSummary(scoped);
    if (current === 'add') renderPreview();
  }
  function renderDashboard(full) {
    renderScopeBar();
    renderKpis(summary(scopeSet()));
    renderAllocation(scopeSet());
    renderPfSummary(summary(scopeSet()));
  }

  const kpi = (label, val, sub = '', c = '') => `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-val ${c}">${val}</div>${sub ? `<div class="kpi-sub ${c}">${sub}</div>` : ''}</div>`;
  function renderKpis(s) {
    $('#kpis').innerHTML =
      `<div class="kpi"><div class="kpi-label">${t('kpi.valueNow')}</div><div class="kpi-val">${fmtUsd(s.value)}</div><div class="kpi-sub ${cls(s.change24)}">24h ${fmtSigned(s.change24)}</div></div>` +
      kpi(t('kpi.cost'), fmtUsd(s.cost)) +
      kpi(t('kpi.unrealized'), fmtSigned(s.unrealized), s.cost ? fmtPct((s.unrealized / s.cost) * 100) : '', cls(s.unrealized)) +
      kpi(t('kpi.realizedSales'), fmtSigned(s.realized), '', cls(s.realized)) +
      kpi(t('kpi.total'), fmtSigned(s.total), '', cls(s.total));
  }

  function renderAllocation(symFilter) {
    const pos = Calc.positions(txs());
    const rows = Object.values(pos).filter((p) => p.qty > 0 && priceOf(p.symbol) != null && (!symFilter || symFilter.has(p.symbol)))
      .map((p) => ({ sym: p.symbol, v: p.qty * priceOf(p.symbol) })).sort((a, b) => b.v - a.v);
    if (!rows.length) { $('#allocation').innerHTML = `<div class="empty">${t('alloc.empty')}</div>`; return; }
    const tot = rows.reduce((a, r) => a + r.v, 0);
    $('#allocation').innerHTML =
      `<div class="alloc-bar">${rows.map((r) => `<span style="width:${(r.v / tot) * 100}%;background:${symColor(r.sym)}"></span>`).join('')}</div>` +
      rows.map((r) => `<div class="alloc-row"><span class="dot" style="background:${symColor(r.sym)}"></span><span class="name">${esc(r.sym)}</span><span class="muted">${((r.v / tot) * 100).toFixed(1)}%</span><b>${fmtUsd(r.v)}</b></div>`).join('');
  }

  function renderPfSummary(s) {
    const row = (label, val, c = '') => `<div class="stat"><span>${label}</span><b class="${c}">${val}</b></div>`;
    const pct = s.cost ? fmtPct((s.unrealized / s.cost) * 100) : '';
    $('#pfSummary').innerHTML =
      row(t('wt.total'), fmtUsd(s.value)) +
      row(t('wt.cost'), fmtUsd(s.cost)) +
      row(t('wt.unrealized'), `${fmtSigned(s.unrealized)} ${pct}`, cls(s.unrealized)) +
      row(t('wt.realized'), fmtSigned(s.realized), cls(s.realized)) +
      row(t('wt.totalPl'), fmtSigned(s.total), cls(s.total)) +
      row(t('wt.24h'), fmtSigned(s.change24), cls(s.change24));
  }

  // Scope chips on the dashboard.
  function renderScopeBar() {
    const bar = $('#pfScope');
    if (!bar) return;
    if (!groups().length) { bar.innerHTML = ''; return; }
    const pos = Calc.positions(txs());
    const hasUngrouped = Object.values(pos).some((p) => p.qty > 0 && groupOf(p.symbol) === UNGROUPED);
    let html = `<span>${t('scope.show')}</span><button data-g="all" class="${isAllScope() ? 'on' : ''}">${t('scope.all')}</button>`;
    for (const g of groups()) html += `<button data-g="${esc(g.id)}" class="${inScope(g.id) ? 'on' : ''}"><i style="background:${g.color}"></i>${esc(g.name)}</button>`;
    if (hasUngrouped) html += `<button data-g="${UNGROUPED}" class="${inScope(UNGROUPED) ? 'on' : ''}">${t('group.ungrouped')}</button>`;
    bar.innerHTML = html;
  }
  $('#pfScope').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const g = b.dataset.g;
    if (g === 'all') state.dashScope = ['all'];
    else {
      let sc = isAllScope() ? [] : state.dashScope.slice();
      sc = sc.includes(g) ? sc.filter((x) => x !== g) : [...sc, g];
      state.dashScope = sc.length ? sc : ['all'];
    }
    renderDashboard(true);
  });

  function renderSymbolLists(s) {
    const syms = Object.keys(s.pos).sort();
    $('#symbolList').innerHTML = syms.map((x) => `<option value="${esc(x)}">`).join('');
    const hf = $('#historyFilter');
    const hv = hf.value;
    hf.innerHTML = `<option value="">${t('hist.allCoins')}</option>` + syms.map((x) => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
    hf.value = syms.includes(hv) ? hv : '';
  }

  // ---------- holdings ----------
  function renderWalletTotal() {
    const s = summary();
    const pct = s.cost ? ` <span class="small">(${fmtPct((s.unrealized / s.cost) * 100)})</span>` : '';
    $('#walletTotal').innerHTML =
      `<div class="wt-item"><span>${t('wt.total')}</span><b>${fmtUsd(s.value)}</b></div>` +
      `<div class="wt-item"><span>${t('wt.cost')}</span><b>${fmtUsd(s.cost)}</b></div>` +
      `<div class="wt-item"><span>${t('wt.unrealized')}</span><b class="${cls(s.unrealized)}">${fmtSigned(s.unrealized)}${pct}</b></div>` +
      `<div class="wt-item"><span>${t('wt.realized')}</span><b class="${cls(s.realized)}">${fmtSigned(s.realized)}</b></div>` +
      `<div class="wt-item"><span>${t('wt.totalPl')}</span><b class="${cls(s.total)}">${fmtSigned(s.total)}</b></div>` +
      `<div class="wt-item"><span>${t('wt.24h')}</span><b class="${cls(s.change24)}">${fmtSigned(s.change24)}</b></div>`;
  }

  function coinRow(p) {
    const px = priceOf(p.symbol);
    const val = px != null ? p.qty * px : null;
    const un = val != null ? val - p.cost : null;
    const q = state.quotes[p.symbol];
    const cur = groupOf(p.symbol);
    const opts = `<option value="${UNGROUPED}" ${cur === UNGROUPED ? 'selected' : ''}>${t('group.ungrouped')}</option>` +
      groups().map((g) => `<option value="${esc(g.id)}" ${cur === g.id ? 'selected' : ''}>${esc(g.name)}</option>`).join('');
    return `<tr>
      <td><div class="coin-cell">${badge(p.symbol)}${esc(p.symbol)}</div></td>
      <td class="ltr">${fmtQty(p.qty)}</td>
      <td class="ltr">${p.qty > 0 ? fmtPrice(p.avg) : '—'}</td>
      <td class="ltr">${fmtPrice(px)}</td>
      <td class="ltr ${cls(q && q.change24h)}">${fmtPct(q && q.change24h)}</td>
      <td class="ltr">${fmtUsd(val)}</td>
      <td class="ltr ${cls(un)}">${p.qty > 0 ? `${fmtSigned(un)}<div class="small">${p.cost ? fmtPct((un / p.cost) * 100) : ''}</div>` : '—'}</td>
      <td class="ltr ${cls(p.realized)}">${fmtSigned(p.realized)}</td>
      <td><select class="move-sel" data-sym="${esc(p.symbol)}">${opts}</select></td>
    </tr>`;
  }

  function renderHoldings() {
    renderWalletTotal();
    renderGroupTabs();
    renderGroupView();
  }

  function renderGroupTabs() {
    const pos = Calc.positions(txs());
    const openCount = (gid) => Object.values(pos).filter((p) => p.qty > 0 && (gid === 'all' || groupOf(p.symbol) === gid)).length;
    const hasUng = Object.values(pos).some((p) => p.qty > 0 && groupOf(p.symbol) === UNGROUPED);
    const ids = ['all', ...groups().map((g) => g.id), ...(hasUng ? [UNGROUPED] : [])];
    if (!ids.includes(state.holdGroup)) state.holdGroup = 'all';
    const tab = (gid, label, color) => `<button class="gtab ${state.holdGroup === gid ? 'on' : ''}" data-g="${esc(gid)}">${color ? `<i style="background:${color}"></i>` : ''}${label} <span class="gtab-n">${openCount(gid)}</span></button>`;
    let html = tab('all', t('scope.all'));
    for (const g of groups()) html += tab(g.id, esc(g.name), g.color);
    if (hasUng) html += tab(UNGROUPED, t('group.ungrouped'), '#8a96ad');
    html += `<button class="gtab gtab-add" data-g="__new__">${t('holdings.newGroup')}</button>`;
    $('#groupTabs').innerHTML = html;
  }

  function renderGroupView() {
    const gid = state.holdGroup;
    const isAll = gid === 'all', isUng = gid === UNGROUPED;
    const symFilter = isAll ? null : new Set(txs().filter((x) => groupOf(x.symbol) === gid).map((x) => x.symbol));
    const s = summary(symFilter);
    const pos = Calc.positions(txs());
    const list = Object.values(pos)
      .filter((p) => (state.showClosedHold || p.qty > 0) && (isAll || groupOf(p.symbol) === gid))
      .sort((a, b) => (b.qty * (priceOf(b.symbol) || 0)) - (a.qty * (priceOf(a.symbol) || 0)));
    const plPct = s.cost ? ` (${fmtPct((s.unrealized / s.cost) * 100)})` : '';
    const nameHtml = isAll ? t('scope.all')
      : isUng ? t('group.ungrouped')
        : `<span class="gv-name">${esc(groupName(gid))}</span>` +
          `<button class="btn icon" data-gact="rename" title="${t('gwin.rename')}">✏️</button>` +
          `<button class="btn icon danger" data-gact="del" title="${t('gwin.delete')}">🗑</button>`;
    const stat = (label, val, c = '') => `<div class="gv-stat"><span>${label}</span><b class="${c}">${val}</b></div>`;
    const table = list.length
      ? `<table class="table"><thead><tr><th>${t('th.coin')}</th><th>${t('th.qty')}</th><th>${t('th.avgBuy')}</th><th>${t('th.priceNow')}</th><th>${t('th.24h')}</th><th>${t('th.value')}</th><th>${t('th.unrealizedShort')}</th><th>${t('th.realizedShort')}</th><th>${t('th.group')}</th></tr></thead><tbody>${list.map(coinRow).join('')}</tbody></table>`
      : `<div class="empty">${isAll ? t('holdings.emptyCanvas') : (isUng ? t('gwin.emptyUng') : t('gwin.emptyGrp'))}</div>`;
    $('#groupView').innerHTML =
      `<div class="gv-head">
        <div class="gv-title" style="--g:${groupColor(gid === 'all' ? UNGROUPED : gid)}">${nameHtml}</div>
        <div class="gv-pl">
          ${stat(t('wt.total'), fmtUsd(s.value))}
          ${stat(t('wt.unrealized'), `${fmtSigned(s.unrealized)}${plPct}`, cls(s.unrealized))}
          ${stat(t('wt.realized'), fmtSigned(s.realized), cls(s.realized))}
          ${stat(t('wt.totalPl'), fmtSigned(s.total), cls(s.total))}
        </div>
        <label class="check"><input type="checkbox" id="showClosed" ${state.showClosedHold ? 'checked' : ''}/> <span>${t('holdings.showClosed')}</span></label>
      </div>
      <div class="table-wrap">${table}</div>`;
  }

  async function newGroup() {
    const g = { id: uid(), name: t('group.defaultName', { n: groups().length + 1 }), color: COLORS[groups().length % COLORS.length] };
    groups().push(g);
    state.holdGroup = g.id;
    await save();
  }
  function deleteGroup(gid) {
    mkt().groups = groups().filter((g) => g.id !== gid);
    for (const s of Object.keys(coinGroups())) if (coinGroups()[s] === gid) delete coinGroups()[s];
    if (groupUi()[gid]) delete groupUi()[gid];
    if (state.holdGroup === gid) state.holdGroup = 'all';
    save();
  }
  function startRenameView(gid) {
    if (gid === UNGROUPED || gid === 'all') return;
    const g = groups().find((x) => x.id === gid); if (!g) return;
    const span = $('#groupView .gv-name'); if (!span) return;
    const inp = document.createElement('input');
    inp.className = 'gwin-rename'; inp.value = g.name;
    span.replaceWith(inp); inp.focus(); inp.select();
    let done = false;
    const commit = async () => { if (done) return; done = true; const v = inp.value.trim(); if (v) g.name = v; await save(); };
    inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') inp.blur(); else if (ev.key === 'Escape') { done = true; renderHoldings(); } });
    inp.addEventListener('blur', commit);
  }

  $('#groupTabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-g]'); if (!b) return;
    const gid = b.dataset.g;
    if (gid === '__new__') { newGroup(); return; }
    state.holdGroup = gid;
    renderGroupTabs();
    renderGroupView();
  });
  $('#groupView').addEventListener('click', async (e) => {
    const act = e.target.closest('button[data-gact]');
    if (act) {
      if (act.dataset.gact === 'rename') startRenameView(state.holdGroup);
      else if (act.dataset.gact === 'del') { if (await confirmBox(t('group.confirmDelete'))) deleteGroup(state.holdGroup); }
      return;
    }
  });
  $('#groupView').addEventListener('change', async (e) => {
    if (e.target.id === 'showClosed') { state.showClosedHold = e.target.checked; renderGroupView(); return; }
    const sel = e.target.closest('.move-sel');
    if (sel) {
      const sym = sel.dataset.sym, gid = sel.value;
      if (gid === UNGROUPED) delete coinGroups()[sym]; else coinGroups()[sym] = gid;
      await save();
    }
  });

  // ---------- add trade ----------
  const addType = seg('#addType', () => { updateFormMode(); renderPreview(); });
  function updateFormMode() {
    const ty = addType();
    $('#buyFields').hidden = ty === 'sell';
    $('#sellFields').hidden = ty === 'buy';
  }
  const num = (id) => parseFloat($(id).value);
  const timeOf = (id) => ($(id).value ? new Date($(id).value).getTime() : NaN);

  async function fetchCurrentPrice() {
    const sym = cleanSym($('#fSymbol').value);
    if (!sym) return toast(t('toast.symFirst'), true);
    const fetcher = state.market === 'crypto' ? api.cryptoQuotes : api.stockQuotes;
    const { quotes, errors } = await fetcher([sym]);
    if (!quotes[sym]) return toast(errors[0] || t('toast.noPrice'), true);
    state.quotes[sym] = quotes[sym];
    const target = addType() === 'sell' ? '#fSellPrice' : (addType() === 'trade' && $('#fBuyPrice').value ? '#fSellPrice' : '#fBuyPrice');
    $(target).value = +quotes[sym].price.toPrecision(8);
    const tt = target === '#fBuyPrice' ? '#fBuyTime' : '#fSellTime';
    if (!$(tt).value) $(tt).value = toLocalInput(Date.now());
    renderPreview();
  }
  $('#fetchPriceBtn').addEventListener('click', () => fetchCurrentPrice().catch((e) => toast(e.message, true)));

  let previewSym = '';
  function renderPreview() {
    const sym = cleanSym($('#fSymbol').value);
    const ty = addType();
    const qty = num('#fQty');
    const bp = num('#fBuyPrice'), sp = num('#fSellPrice');
    const bf = num('#fBuyFee') || 0, sf = num('#fSellFee') || 0;
    const el = $('#preview');
    if (!sym || !(qty > 0)) { el.innerHTML = `<span class="muted">${t('add.previewHint2')}</span>`; return; }
    if (sym !== previewSym && !state.quotes[sym]) {
      previewSym = sym;
      const fetcher = state.market === 'crypto' ? api.cryptoQuotes : api.stockQuotes;
      fetcher([sym]).then(({ quotes }) => { if (quotes[sym]) { state.quotes[sym] = quotes[sym]; renderPreview(); } }).catch(() => {});
    }
    const pos = Calc.positions(txs())[sym];
    const cp = priceOf(sym);
    const row = (label, val, c = '') => `<div class="stat"><span>${label}</span><b class="${c}">${val}</b></div>`;
    let html = `<div class="stat"><span>${badge(sym)} ${esc(sym)}</span><b>${cp ? t('pv.priceNow', { p: fmtPrice(cp) }) : ''}</b></div>`;

    if (ty !== 'sell' && bp > 0) {
      const pv = Calc.previewBuy(pos, bp, qty, bf, cp);
      if (pv.oldQty > 0) {
        html += `<h3>${t('pv.avgAfter')}</h3>
          <div class="compare">
            <div><div class="muted small">${t('pv.oldAvg', { q: fmtQty(pv.oldQty) })}</div><div class="big">${fmtPrice(pv.oldAvg)}</div>
              <div class="small ${cls(pv.plOld && pv.plOld.abs)}">${pv.plOld ? `${fmtSigned(pv.plOld.abs)} (${fmtPct(pv.plOld.pct)})` : ''}</div></div>
            <div><div class="muted small">${t('pv.newAvg', { q: fmtQty(pv.newQty) })}</div><div class="big">${fmtPrice(pv.newAvg)}</div>
              <div class="small ${cls(pv.plNew && pv.plNew.abs)}">${pv.plNew ? `${fmtSigned(pv.plNew.abs)} (${fmtPct(pv.plNew.pct)})` : ''}</div></div>
          </div>` +
          row(t('pv.avgChange'), fmtPct(pv.avgChangePct), cls(-pv.avgChangePct));
      } else {
        html += row(t('pv.buyCost'), fmtUsd(bp * qty + bf));
        if (cp && ty === 'buy') { const pl = qty * cp - (bp * qty + bf); html += row(t('pv.plAtCurrent'), `${fmtSigned(pl)} (${fmtPct((pl / (bp * qty + bf)) * 100)})`, cls(pl)); }
      }
    }
    if (ty === 'trade' && bp > 0 && sp > 0) {
      const cost = bp * qty + bf, proceeds = sp * qty - sf, pl = proceeds - cost;
      const dur = timeOf('#fSellTime') - timeOf('#fBuyTime');
      html += `<h3>${t('pv.tradeResult')}</h3>` +
        row(t('pv.cost'), fmtUsd(cost)) + row(t('pv.proceeds'), fmtUsd(proceeds)) +
        row(t('pv.pl'), `${fmtSigned(pl)} (${fmtPct((pl / cost) * 100)})`, cls(pl)) +
        row(t('pv.duration'), Number.isFinite(dur) ? (dur < 0 ? `<span class="down">${t('pv.sellBeforeBuy')}</span>` : fmtDuration(dur)) : '—');
    }
    if (ty === 'sell' && sp > 0) {
      if (!pos || pos.qty <= 0) html += `<div class="down">${t('pv.noBalance')}</div>`;
      else {
        const q = Math.min(qty, pos.qty), pl = q * (sp - pos.avg) - sf;
        html += row(t('pv.currentBalance'), fmtQty(pos.qty)) + row(t('pv.avgBuy'), fmtPrice(pos.avg)) +
          row(t('pv.plFromSell'), `${fmtSigned(pl)} (${fmtPct((sp / pos.avg - 1) * 100)})`, cls(pl)) +
          row(t('pv.remaining'), fmtQty(pos.qty - q)) +
          (qty > pos.qty ? `<div class="down small">${t('pv.qtyOverBalance')}</div>` : '');
      }
    }
    el.innerHTML = html;
  }
  $('#addForm').addEventListener('input', renderPreview);

  $('#addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = (m) => { $('#formErr').textContent = m; };
    err('');
    const sym = cleanSym($('#fSymbol').value);
    const ty = addType();
    const qty = num('#fQty');
    const note = $('#fNote').value.trim();
    if (!sym) return err(t('err.symbol'));
    if (!(qty > 0)) return err(t('err.qty'));
    const out = [];
    if (ty !== 'sell') {
      const price = num('#fBuyPrice'), time = timeOf('#fBuyTime');
      if (!(price > 0)) return err(t('err.buyPrice'));
      if (!Number.isFinite(time)) return err(t('err.buyTime'));
      out.push({ id: uid(), symbol: sym, side: 'buy', price, qty, fee: num('#fBuyFee') || 0, time, exchange: note, note: '' });
    }
    if (ty !== 'buy') {
      const price = num('#fSellPrice'), time = timeOf('#fSellTime');
      if (!(price > 0)) return err(t('err.sellPrice'));
      if (!Number.isFinite(time)) return err(t('err.sellTime'));
      if (ty === 'trade' && time < out[0].time) return err(t('err.sellAfterBuy'));
      if (ty === 'sell') {
        const pos = Calc.positions(txs())[sym];
        if (!pos || pos.qty + 1e-12 < qty) return err(t('err.sellOverBalance'));
      }
      out.push({ id: uid(), symbol: sym, side: 'sell', price, qty, fee: num('#fSellFee') || 0, time, exchange: note, note: '' });
    }
    txs().push(...out);
    await save();
    toast(t('toast.saved'));
    ['#fQty', '#fBuyPrice', '#fSellPrice', '#fSellTime'].forEach((id) => ($(id).value = ''));
    $('#fBuyFee').value = $('#fSellFee').value = 0;
    $('#fBuyTime').value = toLocalInput(Date.now());
    renderPreview();
    refreshQuotes();
  });

  // ---------- history ----------
  const historyTab = seg('#historyTab', () => renderHistory());
  $('#historyFilter').addEventListener('change', () => renderHistory());
  function renderHistory() {
    const f = $('#historyFilter').value;
    const tbl = $('#historyTable');
    const sumEl = $('#historySummary');
    if (historyTab() === 'closed') {
      const list = Calc.closedTrades(txs()).filter((x) => !f || x.symbol === f);
      const done = list.filter((x) => !x.unmatched);
      const wins = done.filter((x) => x.pl > 0).length;
      const tot = done.reduce((a, x) => a + x.pl, 0);
      const avgDur = done.length ? done.reduce((a, x) => a + x.duration, 0) / done.length : null;
      sumEl.innerHTML = `<span>${t('hist.count')} <b>${done.length}</b></span><span>${t('hist.wins')} <b class="up">${wins}</b></span><span>${t('hist.losses')} <b class="down">${done.length - wins}</b></span><span>${t('hist.winRate')} <b>${done.length ? ((wins / done.length) * 100).toFixed(0) + '%' : '—'}</b></span><span>${t('hist.netProfit')} <b class="${cls(tot)}">${fmtSigned(tot)}</b></span><span>${t('hist.avgDur')} <b>${fmtDuration(avgDur)}</b></span>`;
      if (!list.length) { tbl.innerHTML = `<tr><td class="empty">${t('hist.noClosed')}</td></tr>`; return; }
      tbl.innerHTML = `<thead><tr><th>${t('th.coin')}</th><th>${t('th.qty')}</th><th>${t('hist.buyPrice')}</th><th>${t('hist.buyTime')}</th><th>${t('hist.sellPrice')}</th><th>${t('hist.sellTime')}</th><th>${t('hist.duration')}</th><th>${t('hist.pl')}</th></tr></thead><tbody>` +
        list.map((x) => `<tr>
          <td><div class="coin-cell">${badge(x.symbol)}${esc(x.symbol)}</div></td>
          <td class="ltr">${fmtQty(x.qty)}</td>
          <td class="ltr">${fmtPrice(x.buyPrice)}</td><td>${fmtDate(x.buyTime)}</td>
          <td class="ltr">${fmtPrice(x.sellPrice)}</td><td>${fmtDate(x.sellTime)}</td>
          <td>${x.unmatched ? `<span class="down small">${t('hist.unmatched')}</span>` : fmtDuration(x.duration)}</td>
          <td class="ltr ${cls(x.pl)}">${x.pl == null ? '—' : `${fmtSigned(x.pl)} <span class="small">(${fmtPct(x.plPct)})</span>`}</td></tr>`).join('') + '</tbody>';
    } else {
      const list = Calc.sortTx(txs()).reverse().filter((x) => !f || x.symbol === f);
      sumEl.innerHTML = `<span>${t('hist.opCount')} <b>${list.length}</b></span><span>${t('hist.buys')} <b>${list.filter((x) => x.side === 'buy').length}</b></span><span>${t('hist.sells')} <b>${list.filter((x) => x.side === 'sell').length}</b></span>`;
      if (!list.length) { tbl.innerHTML = `<tr><td class="empty">${t('hist.noOps')}</td></tr>`; return; }
      tbl.innerHTML = `<thead><tr><th>${t('hist.time')}</th><th>${t('th.coin')}</th><th>${t('hist.type')}</th><th>${t('th.price')}</th><th>${t('th.qty')}</th><th>${t('hist.total')}</th><th>${t('hist.fee')}</th><th>${t('hist.exchange')}</th><th></th></tr></thead><tbody>` +
        list.map((x) => `<tr>
          <td>${fmtDate(x.time)}</td><td><div class="coin-cell">${badge(x.symbol)}${esc(x.symbol)}</div></td>
          <td><span class="tag ${x.side}">${x.side === 'buy' ? t('tag.buy') : t('tag.sell')}</span></td>
          <td class="ltr">${fmtPrice(x.price)}</td><td class="ltr">${fmtQty(x.qty)}</td><td class="ltr">${fmtUsd(x.price * x.qty)}</td>
          <td class="ltr">${x.fee ? fmtUsd(x.fee) : '—'}</td><td>${esc(x.exchange || '')}</td>
          <td><button class="btn icon danger" data-del="${esc(x.id)}">${t('btn.delete')}</button></td></tr>`).join('') + '</tbody>';
    }
  }
  $('#historyTable').addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      if (!(await confirmBox(t('hist.confirmDel')))) return;
      mkt().transactions = txs().filter((r) => r.id !== del.dataset.del);
      await save();
      return toast(t('toast.deleted'));
    }
  });

  // ---------- import ----------
  const imp = { rows: null, map: {} };
  const drop = $('#dropZone');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) openImport(e.dataTransfer.files[0]); });
  $('#fileInput').addEventListener('change', (e) => { if (e.target.files[0]) openImport(e.target.files[0]); e.target.value = ''; });

  async function openImport(file) {
    try {
      const rows = await Importer.readFile(file);
      if (rows.length < 2) return toast(t('imp.fileEmpty'), true);
      imp.rows = rows;
      imp.map = Importer.detectColumns(rows[0]);
      $('#importFileName').textContent = file.name;
      const guess = /binance/i.test(file.name) ? 'Binance' : /bybit/i.test(file.name) ? 'Bybit' : /kucoin/i.test(file.name) ? 'KuCoin' : /okx/i.test(file.name) ? 'OKX' : '';
      $('#importExchange').value = guess;
      $('#importArea').hidden = false;
      drop.hidden = true;
      renderMapping();
    } catch (e) { toast(t('imp.readFail', { e: e.message }), true); }
  }
  function renderMapping() {
    const headers = imp.rows[0];
    $('#mapping').innerHTML = Object.keys(Importer.FIELDS).map((f) => `<label>${t('impf.' + f)}
      <select data-field="${f}"><option value="-1">${t('imp.none')}</option>${headers.map((h, i) => `<option value="${i}" ${imp.map[f] === i ? 'selected' : ''}>${esc(h)}</option>`).join('')}</select></label>`).join('');
    renderImportPreview();
  }
  $('#mapping').addEventListener('change', (e) => { const s = e.target.closest('select'); if (s) { imp.map[s.dataset.field] = +s.value; renderImportPreview(); } });
  $('#assumeUTC').addEventListener('change', renderImportPreview);

  function parseImport() {
    const { txs: parsed, skipped } = Importer.toTransactions(imp.rows, imp.map, { assumeUTC: $('#assumeUTC').checked, exchange: $('#importExchange').value.trim() });
    const exists = new Set(txs().map((t) => [t.symbol, t.side, t.time, +t.price.toPrecision(10), +t.qty.toPrecision(10)].join('|')));
    const fresh = parsed.filter((t) => !exists.has([t.symbol, t.side, t.time, +t.price.toPrecision(10), +t.qty.toPrecision(10)].join('|')));
    return { parsed, fresh, skipped, dup: parsed.length - fresh.length };
  }
  function renderImportPreview() {
    const r = parseImport();
    $('#importResult').innerHTML = `<span>${t('imp.rowsInFile')} <b>${imp.rows.length - 1}</b></span><span>${t('imp.ready')} <b class="up">${r.fresh.length}</b></span><span>${t('imp.dup')} <b>${r.dup}</b></span><span>${t('imp.skipped')} <b class="${r.skipped.length ? 'down' : ''}">${r.skipped.length}</b></span>` +
      (r.skipped.length ? `<span class="small">${esc(t('imp.firstReason', { line: r.skipped[0].line, reason: r.skipped[0].reason }))}</span>` : '');
    const sample = r.parsed.slice(0, 12);
    $('#importPreview').innerHTML = sample.length
      ? `<thead><tr><th>${t('hist.time')}</th><th>${t('th.coin')}</th><th>${t('hist.type')}</th><th>${t('th.price')}</th><th>${t('th.qty')}</th><th>${t('imp.fee$')}</th></tr></thead><tbody>` +
        sample.map((r) => `<tr><td>${fmtDate(r.time)}</td><td>${esc(r.symbol)}</td><td><span class="tag ${r.side}">${r.side === 'buy' ? t('tag.buy') : t('tag.sell')}</span></td><td class="ltr">${fmtPrice(r.price)}</td><td class="ltr">${fmtQty(r.qty)}</td><td class="ltr">${fmtUsd(r.fee)}</td></tr>`).join('') + '</tbody>'
      : `<tr><td class="empty">${t('imp.noRecognized')}</td></tr>`;
  }
  function closeImport() { imp.rows = null; $('#importArea').hidden = true; drop.hidden = false; }
  $('#importCancel').addEventListener('click', closeImport);
  $('#importBtn').addEventListener('click', async () => {
    const r = parseImport();
    if (!r.fresh.length) return toast(t('imp.noNew'), true);
    txs().push(...r.fresh.map((x) => ({ ...x, id: uid() })));
    await save();
    closeImport();
    toast(t('imp.done', { n: r.fresh.length }));
    refreshQuotes();
    go('history');
  });

  // ---------- settings ----------
  function loadSettingsForm() {
    const s = state.data.settings;
    $('#sKey').value = s.cmcKey || '';
    $('#sFinnhubKey').value = s.finnhubKey || '';
    $('#sRefresh').value = s.refreshSeconds || 60;
  }
  $('#sKeyShow').addEventListener('click', () => { const k = $('#sKey'); k.type = k.type === 'password' ? 'text' : 'password'; $('#sKeyShow').textContent = t(k.type === 'password' ? 'set.show' : 'set.hide'); });
  $('#cmcLink').addEventListener('click', (e) => { e.preventDefault(); api.openExternal('https://pro.coinmarketcap.com/signup'); });
  $('#finnhubLink').addEventListener('click', (e) => { e.preventDefault(); api.openExternal('https://finnhub.io/register'); });
  $('#sSave').addEventListener('click', async () => {
    Object.assign(state.data.settings, {
      cmcKey: $('#sKey').value.trim(),
      finnhubKey: $('#sFinnhubKey').value.trim(),
      refreshSeconds: Math.max(15, +$('#sRefresh').value || 60),
    });
    await save();
    startTimer();
    toast(t('set.saved'));
    refreshQuotes();
  });
  $('#sTest').addEventListener('click', async () => {
    const key = $('#sKey').value.trim();
    if (!key) return ($('#sMsg').innerHTML = `<span class="down">${t('set.keyFirst')}</span>`);
    $('#sMsg').textContent = t('set.testing');
    const r = await api.testCmcKey(key);
    $('#sMsg').innerHTML = r.ok
      ? `<span class="up">${t('set.keyOk')}</span> ${r.usage && r.usage.current_month ? '— ' + t('set.monthUsage', { used: r.usage.current_month.credits_used, limit: (r.plan && r.plan.credit_limit_monthly) }) : ''}`
      : `<span class="down">${esc(t('set.keyInvalid', { e: r.error }))}</span>`;
  });
  $('#backupBtn').addEventListener('click', async () => { if (await api.exportBackup(state.data)) toast(t('set.backupSaved')); });
  $('#restoreInput').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      const count = (d.crypto && d.crypto.transactions ? d.crypto.transactions.length : 0) +
        (d.stocks && d.stocks.transactions ? d.stocks.transactions.length : 0) +
        (Array.isArray(d.transactions) ? d.transactions.length : 0);
      if (!(await confirmBox(t('set.confirmRestore', { n: count })))) return;
      if (Array.isArray(d.transactions)) {
        state.data.crypto.transactions = d.transactions;
        if (d.groups) state.data.crypto.groups = d.groups;
        if (d.coinGroups) state.data.crypto.coinGroups = d.coinGroups;
      } else {
        if (d.crypto) state.data.crypto = { ...state.data.crypto, ...d.crypto };
        if (d.stocks) state.data.stocks = { ...state.data.stocks, ...d.stocks };
      }
      if (d.settings) state.data.settings = { ...state.data.settings, ...d.settings };
      await save();
      loadSettingsForm();
      applyLang(state.data.settings.lang);
      refreshQuotes();
      toast(t('set.restored'));
    } catch (err) { toast(t('set.restoreFail', { e: err.message }), true); }
  });
  $('#clearBtn').addEventListener('click', async () => {
    if (!(await confirmBox(t('set.confirmClear')))) return;
    mkt().transactions = [];
    await save();
    toast(t('set.cleared'));
  });

  $('#refreshBtn').addEventListener('click', () => refreshQuotes());

  // ---------- language ----------
  function applyLang(lang) {
    window.I18N.setLang(lang, false);
    $$('#langSeg button').forEach((b) => b.classList.toggle('on', b.dataset.v === lang));
    $('#sKeyShow').textContent = t($('#sKey').type === 'password' ? 'set.show' : 'set.hide');
    renderPriceStatus();
    renderAll(true);
    if (imp.rows) renderMapping();
  }
  async function setLangPersist(lang) {
    if (!state.data) return;
    state.data.settings.lang = lang;
    applyLang(lang);
    await api.saveData(state.data);
  }
  $('#langBtn').addEventListener('click', () => setLangPersist(window.I18N.getLang() === 'ar' ? 'en' : 'ar'));
  $('#langSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setLangPersist(b.dataset.v); });

  // ---------- start ----------
  (async function init() {
    state.data = await api.loadData();
    const lang = state.data.settings.lang || 'ar';
    window.I18N.setLang(lang, false);
    window.I18N.applyStatic();
    $$('#langSeg button').forEach((b) => b.classList.toggle('on', b.dataset.v === lang));
    api.appVersion().then((v) => { if (v) $('#versionInfo').textContent = `v${v}`; }).catch(() => {});
    loadSettingsForm();
    $('#fBuyTime').value = toLocalInput(Date.now());
    updateFormMode();
    renderAll();
    await refreshQuotes();
    startTimer();
  })();
})();
