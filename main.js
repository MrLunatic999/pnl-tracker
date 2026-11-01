const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_FILE = () => path.join(app.getPath('userData'), 'pnl-data.json');
const CMC_BASE = 'https://pro-api.coinmarketcap.com';
const BINANCE_BASE = 'https://api.binance.com';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

const DEFAULT_DATA = {
  version: 1,
  crypto: { transactions: [], groups: [], coinGroups: {}, groupUi: {} },
  stocks: { transactions: [], groups: [], coinGroups: {}, groupUi: {} },
  settings: { cmcKey: '', finnhubKey: '', refreshSeconds: 60, lang: 'ar' },
};

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DATA, ...parsed,
      crypto: { ...DEFAULT_DATA.crypto, ...(parsed.crypto || {}) },
      stocks: { ...DEFAULT_DATA.stocks, ...(parsed.stocks || {}) },
      settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData(data) {
  const file = DATA_FILE();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
  return true;
}

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { Accept: 'application/json', ...headers } });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    const msg = (body && body.status && body.status.error_message) || (body && body.msg) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return body;
}

const cache = new Map();
function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.value);
  return fn().then((value) => { cache.set(key, { at: Date.now(), value }); return value; });
}

const STABLES = ['USDT', 'USDC', 'BUSD', 'FDUSD', 'DAI', 'TUSD', 'USD', 'USDP'];
const isStable = (s) => STABLES.includes(s);

// ===== Crypto: CMC + Binance fallback =====
async function cmcQuotes(symbols, key) {
  const url = `${CMC_BASE}/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symbols.join(','))}&convert=USD&skip_invalid=true`;
  const body = await getJson(url, { 'X-CMC_PRO_API_KEY': key });
  const out = {};
  for (const sym of symbols) {
    const d = body.data && body.data[sym];
    const item = Array.isArray(d) ? d[0] : d;
    if (item && item.quote && item.quote.USD) {
      const q = item.quote.USD;
      out[sym] = { price: q.price, change24h: q.percent_change_24h, change7d: q.percent_change_7d, marketCap: q.market_cap, volume24h: q.volume_24h, name: item.name, rank: item.cmc_rank, source: 'CoinMarketCap' };
    }
  }
  return out;
}

async function binanceQuote(sym) {
  if (isStable(sym)) return { price: 1, change24h: 0, source: 'stable' };
  const body = await getJson(`${BINANCE_BASE}/api/v3/ticker/24hr?symbol=${sym}USDT`);
  return { price: +body.lastPrice, change24h: +body.priceChangePercent, volume24h: +body.quoteVolume, source: 'Binance' };
}

ipcMain.handle('market:cryptoQuotes', async (_e, symbols) => {
  const data = loadData();
  const key = data.settings.cmcKey;
  const syms = [...new Set((symbols || []).map((s) => String(s).toUpperCase()))];
  const result = {};
  const errors = [];
  if (key && syms.length) {
    try {
      Object.assign(result, await cached('cmcq:' + syms.join(','), 30e3, () => cmcQuotes(syms, key)));
    } catch (e) { errors.push('CoinMarketCap: ' + e.message); }
  }
  await Promise.all(syms.filter((s) => !result[s]).map(async (s) => {
    try { result[s] = await cached('bq:' + s, 30e3, () => binanceQuote(s)); }
    catch (e) { errors.push(`${s}: ${e.message}`); }
  }));
  return { quotes: result, errors };
});

// ===== Stocks: Finnhub =====
async function finnhubQuote(sym, key) {
  const body = await getJson(`${FINNHUB_BASE}/quote?symbol=${sym}&token=${key}`);
  if (!body || body.c === 0) throw new Error(`No data for ${sym}`);
  return { price: body.c, change24h: body.dp, high: body.h, low: body.l, open: body.o, prevClose: body.pc, source: 'Finnhub' };
}

ipcMain.handle('market:stockQuotes', async (_e, symbols) => {
  const data = loadData();
  const key = data.settings.finnhubKey;
  if (!key) return { quotes: {}, errors: ['Finnhub API key required — set it in Settings'] };
  const syms = [...new Set((symbols || []).map((s) => String(s).toUpperCase()))];
  const result = {};
  const errors = [];
  await Promise.all(syms.map(async (s) => {
    try { result[s] = await cached('fq:' + s, 30e3, () => finnhubQuote(s, key)); }
    catch (e) { errors.push(`${s}: ${e.message}`); }
  }));
  return { quotes: result, errors };
});

ipcMain.handle('cmc:testKey', async (_e, key) => {
  try {
    const body = await getJson(`${CMC_BASE}/v1/key/info`, { 'X-CMC_PRO_API_KEY': key });
    const u = body.data && body.data.usage;
    return { ok: true, plan: body.data && body.data.plan, usage: u };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('data:load', () => loadData());
ipcMain.handle('data:save', (_e, data) => { cache.clear(); return saveData(data); });

ipcMain.handle('data:exportBackup', async (e, data) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: `pnl-backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (canceled || !filePath) return false;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return true;
});

ipcMain.handle('app:openExternal', (_e, url) => {
  if (/^https:\/\//.test(url)) shell.openExternal(url);
});

ipcMain.handle('app:version', () => app.getVersion());

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 880, minWidth: 1000, minHeight: 640,
    backgroundColor: '#0b0f17',
    title: 'PnL Tracker',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
