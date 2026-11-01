// Reads exchange trade-history files (CSV / XLSX) and turns them into transactions.
// Columns are detected by name (Binance, Bybit, KuCoin, OKX, MEXC, Gate...) and can be
// changed by hand in the import screen.
(function () {
  const QUOTES = ['FDUSD', 'USDT', 'USDC', 'BUSD', 'TUSD', 'USDP', 'DAI', 'USD', 'EUR', 'TRY', 'BTC', 'ETH', 'BNB'];
  const USD_QUOTES = ['FDUSD', 'USDT', 'USDC', 'BUSD', 'TUSD', 'USDP', 'DAI', 'USD'];

  const FIELDS = {
    time: ['date(utc)', 'time(utc)', 'datetime', 'date', 'time', 'timestamp', 'filledtime', 'tradetime', 'createdat', 'createtime', 'ordertime', 'executedtime', 'tradecreatedat', 'التاريخ', 'الوقت'],
    pair: ['pair', 'symbol', 'market', 'tradingpair', 'spotpairs', 'instrument', 'instid', 'contract', 'coin', 'العملة', 'الزوج'],
    side: ['side', 'direction', 'tradetype', 'type', 'buy/sell', 'orderside', 'الاتجاه', 'النوع'],
    price: ['price', 'avgprice', 'averageprice', 'filledprice', 'avg.filledprice', 'tradeprice', 'dealprice', 'execprice', 'fillprice', 'السعر'],
    qty: ['executed', 'executedqty', 'filledquantity', 'filledqty', 'filled', 'execqty', 'quantity', 'qty', 'size', 'filledamount', 'dealsize', 'amount', 'الكمية'],
    total: ['total', 'turnover', 'volume', 'dealfunds', 'filledvalue', 'executedamount', 'amount(quote)', 'الإجمالي'],
    fee: ['fee', 'fees', 'tradingfee', 'commission', 'transactionfee', 'الرسوم'],
  };
  const LABELS = { time: 'التاريخ والوقت', pair: 'العملة / الزوج', side: 'شراء/بيع', price: 'السعر', qty: 'الكمية', total: 'الإجمالي (اختياري)', fee: 'الرسوم (اختياري)' };

  const norm = (s) => String(s || '').toLowerCase().replace(/[\s_\-]/g, '');

  function detectColumns(headers) {
    const used = new Set();
    const map = {};
    const H = headers.map(norm);
    for (const field of Object.keys(FIELDS)) {
      let found = -1;
      for (const syn of FIELDS[field]) {           // exact match first, by priority
        const idx = H.findIndex((h, i) => !used.has(i) && h === syn);
        if (idx >= 0) { found = idx; break; }
      }
      if (found < 0) {
        for (const syn of FIELDS[field]) {         // then "contains"
          const idx = H.findIndex((h, i) => !used.has(i) && h.includes(syn));
          if (idx >= 0) { found = idx; break; }
        }
      }
      if (found >= 0) { map[field] = found; used.add(found); }
    }
    return map;
  }

  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const first = text.split(/\r?\n/)[0] || '';
    const delim = [',', ';', '\t'].sort((a, b) => first.split(b).length - first.split(a).length)[0];
    const rows = [];
    let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') q = false;
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some((c) => c.trim() !== '')) rows.push(row);
        row = [];
      } else cell += ch;
    }
    row.push(cell);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
    return rows;
  }

  async function readFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss', defval: '' })
        .map((r) => r.map((c) => String(c)))
        .filter((r) => r.some((c) => c.trim() !== ''));
    }
    return parseCSV(await file.text());
  }

  // "0.0012BTC" -> { n: 0.0012, unit: 'BTC' }
  function parseNum(v) {
    const s = String(v || '').trim();
    const m = s.replace(/,/g, '').match(/-?\d+(\.\d+)?([eE]-?\d+)?/);
    const unit = (s.match(/[A-Za-z]{2,}$/) || [''])[0].toUpperCase();
    return { n: m ? parseFloat(m[0]) : NaN, unit };
  }

  function parseTime(v, assumeUTC) {
    const s = String(v || '').trim();
    if (!s) return NaN;
    if (/^\d{10}$/.test(s)) return +s * 1000;
    if (/^\d{13}$/.test(s)) return +s;
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})[ T]?(\d{1,2})?:?(\d{2})?:?(\d{2})?/);
    if (m && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) {
      const p = m.slice(1).map((x) => +(x || 0));
      return assumeUTC ? Date.UTC(p[0], p[1] - 1, p[2], p[3], p[4], p[5]) : new Date(p[0], p[1] - 1, p[2], p[3], p[4], p[5]).getTime();
    }
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})[ T]?(\d{1,2})?:?(\d{2})?:?(\d{2})?/); // dd/mm/yyyy
    if (m) {
      const p = m.slice(1).map((x) => +(x || 0));
      return assumeUTC ? Date.UTC(p[2], p[1] - 1, p[0], p[3], p[4], p[5]) : new Date(p[2], p[1] - 1, p[0], p[3], p[4], p[5]).getTime();
    }
    return Date.parse(s);
  }

  function splitPair(raw) {
    const s = String(raw || '').toUpperCase().trim();
    const parts = s.split(/[\/\-_: ]+/).filter(Boolean);
    if (parts.length >= 2) return { base: parts[0], quote: parts[1] };
    for (const q of QUOTES) if (s.endsWith(q) && s.length > q.length) return { base: s.slice(0, -q.length), quote: q };
    return { base: s, quote: 'USDT' }; // plain coin name
  }

  function parseSide(v) {
    const s = String(v || '').toLowerCase();
    if (/buy|شراء|^b$|long/.test(s)) return 'buy';
    if (/sell|بيع|^s$|short/.test(s)) return 'sell';
    return null;
  }

  // rows: array of arrays (first row = headers). map: field -> column index
  function toTransactions(rows, map, { assumeUTC = true, exchange = '' } = {}) {
    const txs = [], skipped = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const get = (f) => (map[f] != null && map[f] >= 0 ? row[map[f]] : '');
      const TR = (k, p) => (window.t ? window.t(k, p) : k);
      const why = (reason) => skipped.push({ line: r + 1, reason, raw: row.join(' | ') });
      const { base, quote } = splitPair(get('pair'));
      const side = parseSide(get('side'));
      const time = parseTime(get('time'), assumeUTC);
      const price = parseNum(get('price')).n;
      let qty = parseNum(get('qty')).n;
      const total = parseNum(get('total')).n;
      if (!(qty > 0) && total > 0 && price > 0) qty = total / price;
      if (!base) { why(TR('impr.unknownCoin')); continue; }
      if (!side) { why(TR('impr.unknownSide')); continue; }
      if (!Number.isFinite(time)) { why(TR('impr.badDate')); continue; }
      if (!(price > 0) || !(qty > 0)) { why(TR('impr.badPriceQty')); continue; }
      if (!USD_QUOTES.includes(quote)) { why(TR('impr.nonUsd', { q: quote })); continue; }
      const feeP = parseNum(get('fee'));
      let fee = 0;
      if (feeP.n > 0) {
        if (!feeP.unit || USD_QUOTES.includes(feeP.unit)) fee = feeP.n;
        else if (feeP.unit === base) fee = feeP.n * price;
        // fees in other coins (e.g. BNB) are ignored
      }
      txs.push({ symbol: base, side, price, qty, fee, time, exchange, note: 'import' });
    }
    return { txs, skipped };
  }

  window.Importer = { FIELDS, LABELS, readFile, detectColumns, toTransactions };
})();
