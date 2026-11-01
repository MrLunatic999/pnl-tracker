# PnL Tracker

Open-source profit & loss tracker for **Crypto** and **US Stocks**. Built with Electron.

![MIT License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Dual market support** — separate portfolios for Crypto and US Stocks
- **Average cost method** — automatic cost-basis and P/L calculation
- **FIFO closed trades** — matching sells to buys with hold duration
- **Groups** — organize assets into custom groups/portfolios
- **Import** — CSV/Excel trade history from Binance, Bybit, KuCoin, OKX, etc.
- **Bilingual** — Arabic (RTL) and English
- **Privacy** — all data stored locally on your machine, no accounts
- **Backup/Restore** — export and import your data as JSON

## Price Sources

| Market | Primary | Fallback |
|--------|---------|----------|
| Crypto | CoinMarketCap (free API key) | Binance |
| US Stocks | Finnhub (free API key) | — |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Git](https://git-scm.com/)

### Install & Run

```bash
git clone https://github.com/mr-lunatic999/pnl-tracker.git
cd pnl-tracker
npm install
npm start
```

### Build (Windows)

```bash
npm run dist
```

The installer will be in the `dist/` folder.

## API Keys (Free)

1. **CoinMarketCap** — Get a free key at [pro.coinmarketcap.com](https://pro.coinmarketcap.com/signup). Without it, Binance is used as fallback for crypto prices.
2. **Finnhub** — Get a free key at [finnhub.io](https://finnhub.io/register). Required for US stock prices.

Enter your keys in **Settings** inside the app.

## License

[MIT](LICENSE)
