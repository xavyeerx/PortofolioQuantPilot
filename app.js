const STORAGE_KEY = "quantpilot.portfolio.v1";
const STARTING_CASH = 20_000_000;
const DEFAULT_ALLOCATION = 1_000_000;

const sampleMessages = [
  `🚀 STRONG BUY SIGNAL
⏰ 17 Jul 2026, 15:07 WIB

🟢 KOKA | 196 (+14.6%)
   └─ Score: 80 | ST-CONT — 2 bar di atas supertrend + volume | Vol: 2.6x | Mkt:BULL
🎯 TP1: 219 (+11.6%)
🚀 TP2: 226 (+15.3%) 📋 resist
🔴 SL: 186 (-5.0%)`,
  `🚀 STRONG BUY SIGNAL
⏰ 17 Jul 2026, 15:33 WIB

🟢 EPAC | 72 (+2.9%)
   └─ Score: 81 | ST-CONT — 2 bar di atas supertrend + volume | Vol: 2.7x | Mkt:BULL
🎯 TP1: 79 (+9.8%)
🚀 TP2: 85 (+18.1%) 📋 resist
🔴 SL: 68 (-5.0%)`
];

const state = loadState();
let parsedSignal = null;

const el = {
  metricGrid: document.querySelector("#dashboard"),
  rawSignal: document.querySelector("#rawSignal"),
  tickerInput: document.querySelector("#tickerInput"),
  entryPriceInput: document.querySelector("#entryPriceInput"),
  tp1Input: document.querySelector("#tp1Input"),
  tp2Input: document.querySelector("#tp2Input"),
  stopLossInput: document.querySelector("#stopLossInput"),
  callTimeInput: document.querySelector("#callTimeInput"),
  allocationInput: document.querySelector("#allocationInput"),
  sourceInput: document.querySelector("#sourceInput"),
  saveSignalButton: document.querySelector("#saveSignalButton"),
  parseStatus: document.querySelector("#parseStatus"),
  parsedPreview: document.querySelector("#parsedPreview"),
  positionsTable: document.querySelector("#positionsTable"),
  signalsTable: document.querySelector("#signalsTable"),
  analyticsView: document.querySelector("#analyticsView"),
  equityChart: document.querySelector("#equityChart"),
  seedButton: document.querySelector("#seedButton"),
  resetButton: document.querySelector("#resetButton"),
  tradeDialog: document.querySelector("#tradeDialog"),
  tradeForm: document.querySelector("#tradeForm"),
  tradeIdInput: document.querySelector("#tradeIdInput"),
  dialogTitle: document.querySelector("#dialogTitle"),
  buyPriceInput: document.querySelector("#buyPriceInput"),
  quantityInput: document.querySelector("#quantityInput"),
  currentPriceInput: document.querySelector("#currentPriceInput"),
  buyFeeInput: document.querySelector("#buyFeeInput"),
  sellPriceInput: document.querySelector("#sellPriceInput"),
  sellFeeInput: document.querySelector("#sellFeeInput"),
  exitReasonInput: document.querySelector("#exitReasonInput"),
  cancelDialogButton: document.querySelector("#cancelDialogButton")
};

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return {
    settings: { startingCash: STARTING_CASH, defaultAllocation: DEFAULT_ALLOCATION },
    signals: [],
    trades: [],
    auditEvents: []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function id(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Math.round(value || 0));
}

function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function parseNumber(pattern, text) {
  const match = text.match(pattern);
  return match ? Number(match[1].replace(",", ".")) : null;
}

function parseSignal(rawMessage, source, allocation) {
  const clean = rawMessage.replace(/\r/g, "");
  const tickerLine = clean.match(/([A-Z]{3,5})\s*\|\s*(\d+(?:\.\d+)?)\s*\(([+-]?\d+(?:[.,]\d+)?)%\)/);
  const timeLine = clean.match(/(\d{1,2}\s+\w+\s+\d{4},\s+\d{2}:\d{2}\s+WIB)/i);
  const score = parseNumber(/Score:\s*(\d+)/i, clean);
  const volume = parseNumber(/Vol:\s*(\d+(?:[.,]\d+)?)x/i, clean);
  const market = clean.match(/Mkt:\s*([A-Z]+)/i)?.[1] || "";
  const strategy = clean.match(/Score:\s*\d+\s*\|\s*(.*?)\s*\|\s*Vol:/i)?.[1] || "";

  if (!tickerLine) {
    throw new Error("Ticker dan harga signal belum terbaca.");
  }

  const signalPrice = Number(tickerLine[2]);
  const tp1 = parseNumber(/TP1:\s*(\d+(?:\.\d+)?)/i, clean);
  const tp2 = parseNumber(/TP2:\s*(\d+(?:\.\d+)?)/i, clean);
  const stopLoss = parseNumber(/SL:\s*(\d+(?:\.\d+)?)/i, clean);
  const plannedQuantity = Math.floor(allocation / signalPrice);

  return {
    id: id("sig"),
    source,
    rawMessage,
    signalType: clean.includes("STRONG BUY") ? "STRONG_BUY" : "BUY",
    ticker: tickerLine[1],
    signalPrice,
    priceChangePct: Number(tickerLine[3].replace(",", ".")),
    score,
    marketCondition: market,
    strategyTags: strategy.split(/[—+-]/).map((item) => item.trim()).filter(Boolean),
    volumeMultiplier: volume,
    tp1Price: tp1,
    tp1Pct: tp1 ? ((tp1 - signalPrice) / signalPrice) * 100 : null,
    tp2Price: tp2,
    tp2Pct: tp2 ? ((tp2 - signalPrice) / signalPrice) * 100 : null,
    stopLossPrice: stopLoss,
    stopLossPct: stopLoss ? ((stopLoss - signalPrice) / signalPrice) * 100 : null,
    signalAt: timeLine ? timeLine[1] : new Date().toISOString(),
    allocation,
    plannedQuantity,
    status: "planned",
    createdAt: new Date().toISOString()
  };
}

function createManualSignal() {
  const ticker = el.tickerInput.value.trim().toUpperCase();
  const signalPrice = Number(el.entryPriceInput.value);
  const allocation = Number(el.allocationInput.value || DEFAULT_ALLOCATION);
  const tp1 = Number(el.tp1Input.value || 0) || null;
  const tp2 = Number(el.tp2Input.value || 0) || null;
  const stopLoss = Number(el.stopLossInput.value || 0) || null;

  if (!ticker) throw new Error("Ticker wajib diisi.");
  if (!signalPrice) throw new Error("Entry price wajib diisi.");

  return {
    id: id("sig"),
    source: el.sourceInput.value || "Telegram",
    rawMessage: el.rawSignal.value,
    signalType: "TELEGRAM_CALL",
    ticker,
    signalPrice,
    priceChangePct: null,
    score: null,
    marketCondition: "",
    strategyTags: [],
    volumeMultiplier: null,
    tp1Price: tp1,
    tp1Pct: tp1 ? ((tp1 - signalPrice) / signalPrice) * 100 : null,
    tp2Price: tp2,
    tp2Pct: tp2 ? ((tp2 - signalPrice) / signalPrice) * 100 : null,
    stopLossPrice: stopLoss,
    stopLossPct: stopLoss ? ((stopLoss - signalPrice) / signalPrice) * 100 : null,
    signalAt: el.callTimeInput.value || new Date().toISOString(),
    allocation,
    plannedQuantity: Math.floor(allocation / signalPrice),
    status: "planned",
    createdAt: new Date().toISOString()
  };
}

function clearManualForm() {
  el.tickerInput.value = "";
  el.entryPriceInput.value = "";
  el.tp1Input.value = "";
  el.tp2Input.value = "";
  el.stopLossInput.value = "";
  el.callTimeInput.value = "";
  el.rawSignal.value = "";
}
function createTradeFromSignal(signal) {
  return {
    id: id("trd"),
    signalId: signal.id,
    ticker: signal.ticker,
    status: "planned",
    allocation: signal.allocation,
    plannedEntryPrice: signal.signalPrice,
    plannedQuantity: signal.plannedQuantity,
    tp1Price: signal.tp1Price,
    tp2Price: signal.tp2Price,
    stopLossPrice: signal.stopLossPrice,
    buyPrice: null,
    quantity: signal.plannedQuantity,
    buyFee: 0,
    currentPrice: signal.signalPrice,
    highestPriceAfterEntry: signal.signalPrice,
    lowestPriceAfterEntry: signal.signalPrice,
    sellPrice: null,
    sellFee: 0,
    exitReason: "",
    entryAt: null,
    exitAt: null,
    createdAt: new Date().toISOString()
  };
}

function getSignal(trade) {
  return state.signals.find((signal) => signal.id === trade.signalId);
}

function enrichTrade(trade) {
  const buyPrice = Number(trade.buyPrice || trade.plannedEntryPrice || 0);
  const quantity = Number(trade.quantity || 0);
  const currentPrice = Number(trade.currentPrice || buyPrice);
  const sellPrice = Number(trade.sellPrice || 0);
  const buyGross = buyPrice * quantity;
  const sellGross = sellPrice * quantity;
  const isClosed = trade.status === "closed";
  const realizedPnl = isClosed ? sellGross - buyGross - Number(trade.buyFee || 0) - Number(trade.sellFee || 0) : 0;
  const unrealizedPnl = trade.status === "entered" ? (currentPrice - buyPrice) * quantity - Number(trade.buyFee || 0) : 0;
  const highest = Number(trade.highestPriceAfterEntry || currentPrice || buyPrice);
  const lowest = Number(trade.lowestPriceAfterEntry || currentPrice || buyPrice);

  return {
    ...trade,
    buyGross,
    sellGross,
    realizedPnl,
    unrealizedPnl,
    realizedReturnPct: buyGross ? (realizedPnl / buyGross) * 100 : 0,
    unrealizedReturnPct: buyGross ? (unrealizedPnl / buyGross) * 100 : 0,
    mfePct: buyPrice ? ((highest - buyPrice) / buyPrice) * 100 : 0,
    maePct: buyPrice ? ((lowest - buyPrice) / buyPrice) * 100 : 0
  };
}

function portfolioMetrics() {
  const trades = state.trades.map(enrichTrade);
  const entered = trades.filter((trade) => trade.status === "entered");
  const closed = trades.filter((trade) => trade.status === "closed");
  const wins = closed.filter((trade) => trade.realizedPnl > 0);
  const losses = closed.filter((trade) => trade.realizedPnl <= 0);
  const invested = entered.reduce((sum, trade) => sum + trade.buyGross, 0);
  const realized = closed.reduce((sum, trade) => sum + trade.realizedPnl, 0);
  const unrealized = entered.reduce((sum, trade) => sum + trade.unrealizedPnl, 0);
  const equity = STARTING_CASH + realized + unrealized;
  const cash = STARTING_CASH - invested + realized;
  const averageWin = wins.length ? wins.reduce((sum, trade) => sum + trade.realizedPnl, 0) / wins.length : 0;
  const averageLoss = losses.length ? Math.abs(losses.reduce((sum, trade) => sum + trade.realizedPnl, 0) / losses.length) : 0;
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;

  return {
    trades,
    entered,
    closed,
    wins,
    losses,
    invested,
    realized,
    unrealized,
    equity,
    cash,
    averageWin,
    averageLoss,
    winRate
  };
}

function renderMetrics() {
  const m = portfolioMetrics();
  const metrics = [
    ["Total Equity", rupiah(m.equity), `${pct(((m.equity - STARTING_CASH) / STARTING_CASH) * 100)} vs modal awal`],
    ["Available Cash", rupiah(m.cash), `${Math.max(0, Math.floor(m.cash / DEFAULT_ALLOCATION))} slot tersisa`],
    ["Realized P/L", rupiah(m.realized), `${m.closed.length} closed trades`],
    ["Unrealized P/L", rupiah(m.unrealized), `${m.entered.length} active positions`],
    ["Win Rate", pct(m.winRate), `${m.wins.length} win / ${m.closed.length} closed`],
    ["Avg Win", rupiah(m.averageWin), "closed winners only"],
    ["Avg Loss", rupiah(m.averageLoss), "closed losers only"],
    ["Signals", String(state.signals.length), `${state.trades.filter((trade) => trade.status === "planned").length} planned`]
  ];

  el.metricGrid.innerHTML = metrics.map(([label, value, note]) => `
    <div class="metric-card">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${note}</small>
    </div>
  `).join("");
}

function renderPreview(signal) {
  if (!signal) {
    el.parsedPreview.innerHTML = "";
    return;
  }
  const items = [
    ["Ticker", signal.ticker],
    ["Signal Price", signal.signalPrice],
    ["Score", signal.score],
    ["Volume", `${signal.volumeMultiplier}x`],
    ["Market", signal.marketCondition],
    ["Plan Qty", signal.plannedQuantity],
    ["TP1", `${signal.tp1Price} (${pct(signal.tp1Pct)})`],
    ["SL", `${signal.stopLossPrice} (${pct(signal.stopLossPct)})`]
  ];
  el.parsedPreview.innerHTML = items.map(([label, value]) => `<div><small>${label}</small><br><strong>${value ?? "-"}</strong></div>`).join("");
}

function renderPositions() {
  const rows = portfolioMetrics().entered;
  if (!rows.length) {
    el.positionsTable.innerHTML = `<p class="muted-copy">Belum ada posisi aktif.</p>`;
    return;
  }
  el.positionsTable.innerHTML = `
    <table>
      <thead><tr><th>Ticker</th><th>Entry</th><th>Current</th><th>Highest</th><th>TP/SL</th><th>Unrealized</th><th>MFE/MAE</th><th>Action</th></tr></thead>
      <tbody>
        ${rows.map((trade) => `
          <tr>
            <td><strong>${trade.ticker}</strong></td>
            <td>${trade.buyPrice} x ${trade.quantity}</td>
            <td>${trade.currentPrice}</td>
            <td>${trade.highestPriceAfterEntry}</td>
            <td>TP1 ${trade.tp1Price || "-"} / TP2 ${trade.tp2Price || "-"} / SL ${trade.stopLossPrice || "-"}</td>
            <td class="${trade.unrealizedPnl >= 0 ? "positive" : "negative"}">${rupiah(trade.unrealizedPnl)}<br>${pct(trade.unrealizedReturnPct)}</td>
            <td>${pct(trade.mfePct)} / ${pct(trade.maePct)}</td>
            <td><button type="button" data-edit="${trade.id}">Update</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderSignals() {
  const tradesBySignal = new Map(state.trades.map((trade) => [trade.signalId, enrichTrade(trade)]));
  if (!state.signals.length) {
    el.signalsTable.innerHTML = `<p class="muted-copy">Belum ada signal tersimpan.</p>`;
    return;
  }
  el.signalsTable.innerHTML = `
    <table>
      <thead><tr><th>Signal</th><th>Plan</th><th>Score</th><th>Target</th><th>Status</th><th>P/L</th><th>Action</th></tr></thead>
      <tbody>
        ${state.signals.map((signal) => {
          const trade = tradesBySignal.get(signal.id);
          const pnl = trade?.status === "closed" ? trade.realizedPnl : trade?.unrealizedPnl || 0;
          return `
            <tr>
              <td><strong>${signal.ticker}</strong><br><small>${signal.signalAt}</small></td>
              <td>${rupiah(signal.allocation)}<br>${signal.plannedQuantity} shares @ ${signal.signalPrice}</td>
              <td>${signal.score || "-"}<br><span class="tag">${signal.marketCondition || "N/A"}</span></td>
              <td>TP1 ${signal.tp1Price || "-"}<br>TP2 ${signal.tp2Price || "-"}<br>SL ${signal.stopLossPrice || "-"}</td>
              <td><span class="status-chip ${trade?.status === "closed" ? "muted" : ""}">${trade?.status || "planned"}</span></td>
              <td class="${pnl >= 0 ? "positive" : "negative"}">${rupiah(pnl)}</td>
              <td>
                <button type="button" data-edit="${trade.id}">${trade.status === "planned" ? "Enter" : "Edit"}</button>
                <button class="ghost-button" type="button" data-skip="${trade.id}">Skip</button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderAnalytics() {
  const m = portfolioMetrics();
  const totalClosed = Math.max(1, m.closed.length);
  const winWidth = (m.wins.length / totalClosed) * 100;
  const lossWidth = (m.losses.length / totalClosed) * 100;
  const avgMfe = m.trades.length ? m.trades.reduce((sum, trade) => sum + trade.mfePct, 0) / m.trades.length : 0;
  const avgMae = m.trades.length ? m.trades.reduce((sum, trade) => sum + trade.maePct, 0) / m.trades.length : 0;

  el.analyticsView.innerHTML = `
    <div class="analytics-bars">
      <div>
        <div class="position-line"><strong>Winning Trades</strong><span>${m.wins.length}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${winWidth}%"></div></div>
      </div>
      <div>
        <div class="position-line"><strong>Losing Trades</strong><span>${m.losses.length}</span></div>
        <div class="bar-track"><div class="bar-fill red" style="width:${lossWidth}%"></div></div>
      </div>
      <div class="metric-card">
        <span>Average MFE</span>
        <strong>${pct(avgMfe)}</strong>
        <small>Potensi kenaikan maksimum setelah entry</small>
      </div>
      <div class="metric-card">
        <span>Average MAE</span>
        <strong>${pct(avgMae)}</strong>
        <small>Tekanan turun maksimum setelah entry</small>
      </div>
    </div>
  `;
}

function renderEquityChart() {
  const closed = portfolioMetrics().closed;
  const points = [{ label: "Start", value: STARTING_CASH }];
  let equity = STARTING_CASH;
  closed.forEach((trade) => {
    equity += trade.realizedPnl;
    points.push({ label: trade.ticker, value: equity });
  });
  const values = points.map((point) => point.value);
  const min = Math.min(...values, STARTING_CASH * 0.98);
  const max = Math.max(...values, STARTING_CASH * 1.02);
  const width = 640;
  const height = 280;
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? 20 : 28 + (index * (width - 56)) / (points.length - 1);
    const y = height - 28 - ((point.value - min) / (max - min || 1)) * (height - 56);
    return `${x},${y}`;
  }).join(" ");

  el.equityChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Equity curve">
      <rect width="${width}" height="${height}" rx="8" fill="#171a16"></rect>
      <line x1="28" y1="${height - 28}" x2="${width - 28}" y2="${height - 28}" stroke="#4c5548"></line>
      <polyline points="${coords}" fill="none" stroke="#c6ef5f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
      ${points.map((point, index) => {
        const [x, y] = coords.split(" ")[index].split(",");
        return `<circle cx="${x}" cy="${y}" r="5" fill="#f5f1e6"><title>${point.label}: ${rupiah(point.value)}</title></circle>`;
      }).join("")}
      <text x="28" y="32" fill="#f5f1e6" font-size="18" font-weight="800">${rupiah(points.at(-1).value)}</text>
      <text x="28" y="55" fill="#aab1a4" font-size="12">Closed-trade equity curve</text>
    </svg>
  `;
}

function render() {
  renderMetrics();
  renderPositions();
  renderSignals();
  renderAnalytics();
  renderEquityChart();
  saveState();
}

function openTradeDialog(tradeId) {
  const trade = state.trades.find((item) => item.id === tradeId);
  if (!trade) return;
  el.tradeIdInput.value = trade.id;
  el.dialogTitle.textContent = `${trade.ticker} Trade`;
  el.buyPriceInput.value = trade.buyPrice || trade.plannedEntryPrice;
  el.quantityInput.value = trade.quantity || trade.plannedQuantity;
  el.currentPriceInput.value = trade.currentPrice || trade.plannedEntryPrice;
  el.buyFeeInput.value = trade.buyFee || 0;
  el.sellPriceInput.value = trade.sellPrice || "";
  el.sellFeeInput.value = trade.sellFee || 0;
  el.exitReasonInput.value = trade.exitReason || "";
  el.tradeDialog.showModal();
}

el.saveSignalButton.addEventListener("click", () => {
  try {
    const signal = createManualSignal();
    state.signals.unshift(signal);
    state.trades.unshift(createTradeFromSignal(signal));
    parsedSignal = null;
    clearManualForm();
    renderPreview(signal);
    el.parseStatus.textContent = "Saved";
    el.parseStatus.classList.remove("muted", "red");
    render();
  } catch (error) {
    el.parseStatus.textContent = error.message;
    el.parseStatus.classList.add("red");
  }
});

el.seedButton.addEventListener("click", () => {
  sampleMessages.forEach((message) => {
    const signal = parseSignal(message, "Sample", DEFAULT_ALLOCATION);
    state.signals.push(signal);
    state.trades.push(createTradeFromSignal(signal));
  });
  render();
});

el.resetButton.addEventListener("click", () => {
  if (!confirm("Reset semua data local tracker?")) return;
  state.signals = [];
  state.trades = [];
  state.auditEvents = [];
  render();
});

document.body.addEventListener("click", (event) => {
  const editId = event.target.dataset?.edit;
  const skipId = event.target.dataset?.skip;
  if (editId) openTradeDialog(editId);
  if (skipId) {
    const trade = state.trades.find((item) => item.id === skipId);
    if (trade) {
      trade.status = "skipped";
      const signal = getSignal(trade);
      if (signal) signal.status = "skipped";
      render();
    }
  }
});

el.tradeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const trade = state.trades.find((item) => item.id === el.tradeIdInput.value);
  if (!trade) return;
  const buyPrice = Number(el.buyPriceInput.value);
  const currentPrice = Number(el.currentPriceInput.value || buyPrice);
  const sellPrice = Number(el.sellPriceInput.value || 0);
  trade.buyPrice = buyPrice;
  trade.quantity = Number(el.quantityInput.value);
  trade.currentPrice = currentPrice;
  trade.buyFee = Number(el.buyFeeInput.value || 0);
  trade.sellPrice = sellPrice || null;
  trade.sellFee = Number(el.sellFeeInput.value || 0);
  trade.exitReason = el.exitReasonInput.value;
  trade.highestPriceAfterEntry = Math.max(Number(trade.highestPriceAfterEntry || buyPrice), currentPrice, sellPrice || 0);
  trade.lowestPriceAfterEntry = Math.min(Number(trade.lowestPriceAfterEntry || buyPrice), currentPrice, sellPrice || currentPrice);
  trade.status = sellPrice ? "closed" : "entered";
  trade.entryAt = trade.entryAt || new Date().toISOString();
  trade.exitAt = sellPrice ? new Date().toISOString() : null;
  const signal = getSignal(trade);
  if (signal) signal.status = trade.status;
  el.tradeDialog.close();
  render();
});

el.cancelDialogButton.addEventListener("click", () => el.tradeDialog.close());

render();
