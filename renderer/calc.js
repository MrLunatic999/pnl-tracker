(function () {
  const sortTx = (txs) => [...txs].sort((a, b) => a.time - b.time || (a.side === 'buy' ? -1 : 1));

  function positions(txs) {
    const map = {};
    for (const t of sortTx(txs)) {
      const p = (map[t.symbol] ||= {
        symbol: t.symbol, qty: 0, cost: 0, realized: 0, fees: 0, bought: 0, boughtQty: 0, sold: 0, soldQty: 0,
        firstTime: t.time, lastTime: t.time, avgHistory: [], txCount: 0,
      });
      p.txCount++;
      p.lastTime = t.time;
      p.fees += t.fee || 0;
      if (t.side === 'buy') {
        p.cost += t.qty * t.price + (t.fee || 0);
        p.qty += t.qty;
        p.bought += t.qty * t.price;
        p.boughtQty += t.qty;
        p.avgHistory.push({ time: t.time, txId: t.id, price: t.price, qty: t.qty, oldAvg: p.qty - t.qty > 0 ? (p.cost - t.qty * t.price - (t.fee || 0)) / (p.qty - t.qty) : null, newAvg: p.cost / p.qty, holding: p.qty });
      } else {
        const avg = p.qty > 0 ? p.cost / p.qty : t.price;
        const q = Math.min(t.qty, p.qty);
        p.realized += q * (t.price - avg) - (t.fee || 0);
        p.cost -= q * avg;
        p.qty -= q;
        p.sold += t.qty * t.price;
        p.soldQty += t.qty;
        if (p.qty < 1e-12) { p.qty = 0; p.cost = 0; }
      }
    }
    for (const p of Object.values(map)) p.avg = p.qty > 0 ? p.cost / p.qty : 0;
    return map;
  }

  function previewBuy(pos, price, qty, fee, currentPrice) {
    const oldQty = pos ? pos.qty : 0;
    const oldCost = pos ? pos.cost : 0;
    const oldAvg = oldQty > 0 ? oldCost / oldQty : null;
    const newQty = oldQty + qty;
    const newCost = oldCost + qty * price + (fee || 0);
    const newAvg = newQty > 0 ? newCost / newQty : null;
    const cp = currentPrice || price;
    return {
      oldQty, oldAvg, newQty, newAvg, currentPrice: cp,
      plOld: oldAvg ? { abs: (cp - oldAvg) * oldQty, pct: (cp / oldAvg - 1) * 100 } : null,
      plNew: newAvg ? { abs: newQty * cp - newCost, pct: (cp / newAvg - 1) * 100 } : null,
      avgChangePct: oldAvg && newAvg ? (newAvg / oldAvg - 1) * 100 : null,
    };
  }

  function closedTrades(txs) {
    const lots = {};
    const out = [];
    for (const t of sortTx(txs)) {
      const q = (lots[t.symbol] ||= []);
      if (t.side === 'buy') {
        q.push({ qty: t.qty, price: t.price, time: t.time, feePerUnit: (t.fee || 0) / t.qty, txId: t.id });
        continue;
      }
      let remaining = t.qty;
      const sellFeePerUnit = (t.fee || 0) / t.qty;
      while (remaining > 1e-12 && q.length) {
        const lot = q[0];
        const used = Math.min(lot.qty, remaining);
        const cost = used * (lot.price + lot.feePerUnit);
        const proceeds = used * (t.price - sellFeePerUnit);
        out.push({
          symbol: t.symbol, qty: used, buyPrice: lot.price, sellPrice: t.price, buyTime: lot.time, sellTime: t.time,
          duration: t.time - lot.time, pl: proceeds - cost, plPct: (proceeds / cost - 1) * 100,
          buyTxId: lot.txId, sellTxId: t.id,
        });
        lot.qty -= used;
        remaining -= used;
        if (lot.qty < 1e-12) q.shift();
      }
      if (remaining > 1e-9) {
        out.push({ symbol: t.symbol, qty: remaining, buyPrice: null, sellPrice: t.price, buyTime: null, sellTime: t.time, duration: null, pl: null, plPct: null, sellTxId: t.id, unmatched: true });
      }
    }
    return out.sort((a, b) => b.sellTime - a.sellTime);
  }

  function fmtDuration(ms) {
    if (ms == null) return '—';
    const m = Math.floor(ms / 60000);
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    const parts = [];
    if (d) parts.push(`${d} يوم`);
    if (h) parts.push(`${h} ساعة`);
    if (!d && mm) parts.push(`${mm} دقيقة`);
    return parts.join(' و ') || 'أقل من دقيقة';
  }

  window.Calc = { sortTx, positions, previewBuy, closedTrades, fmtDuration };
})();
