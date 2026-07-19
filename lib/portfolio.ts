export const STORAGE_KEY = "quantpilot.portfolio.v1";
export const STARTING_CASH = 20_000_000;
export const DEFAULT_ALLOCATION = 1_000_000;
export const DEFAULT_LOT_SIZE = 100;
export const STOCKBIT_BUY_FEE_RATE = 0.0015;
export const STOCKBIT_SELL_FEE_RATE = 0.0025;

export type TradeStatus = "planned" | "entered" | "closed" | "skipped";

export interface Signal {
  id: string;
  source: string;
  rawMessage?: string;
  signalType?: string;
  ticker: string;
  signalPrice: number;
  tp1Price: number | null;
  tp2Price: number | null;
  stopLossPrice: number | null;
  signalAt: string;
  allocation: number;
  plannedQuantity: number;
  status: TradeStatus;
  createdAt: string;
}

export interface Trade {
  id: string;
  signalId: string;
  ticker: string;
  status: TradeStatus;
  allocation: number;
  plannedEntryPrice: number;
  plannedQuantity: number;
  tp1Price: number | null;
  tp2Price: number | null;
  stopLossPrice: number | null;
  buyPrice: number | null;
  quantity: number;
  buyFee: number;
  currentPrice: number;
  highestPriceAfterEntry: number;
  lowestPriceAfterEntry: number;
  sellPrice: number | null;
  sellFee: number;
  exitReason: string;
  entryAt: string | null;
  exitAt: string | null;
  createdAt: string;
}

export interface PortfolioSettings {
  startingCash: number;
  defaultAllocation: number;
  lotSize: number;
}

export interface PortfolioState {
  settings: PortfolioSettings;
  signals: Signal[];
  trades: Trade[];
  auditEvents: unknown[];
}

export interface EnrichedTrade extends Trade {
  buyGross: number;
  buyTotal: number;
  sellGross: number;
  netPositionValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
  returnPct: number;
  mfePct: number;
  maePct: number;
}

export const id = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const calculateBuyFee = (grossAmount: number) =>
  Math.round(grossAmount * STOCKBIT_BUY_FEE_RATE);

export const calculateSellFee = (grossAmount: number) =>
  Math.round(grossAmount * STOCKBIT_SELL_FEE_RATE);

export const calculateBuyTotal = (grossAmount: number) =>
  grossAmount + calculateBuyFee(grossAmount);

export const calculateNetSellValue = (grossAmount: number) =>
  grossAmount - calculateSellFee(grossAmount);
export const calculatePlannedQuantity = (
  allocation: number,
  price: number,
  lotSize = DEFAULT_LOT_SIZE,
) => {
  if (allocation <= 0 || price <= 0 || lotSize <= 0) return 0;
  return Math.floor(allocation / (price * lotSize * (1 + STOCKBIT_BUY_FEE_RATE))) * lotSize;
};
export const formatIDR = (value: number, compact = false) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(Math.round(value || 0));

export const formatPct = (value: number) =>
  `${value > 0 ? "+" : ""}${Number(value || 0).toFixed(1)}%`;

export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export function enrichTrade(trade: Trade): EnrichedTrade {
  const buyPrice = Number(trade.buyPrice || trade.plannedEntryPrice || 0);
  const quantity = Number(trade.quantity || 0);
  const currentPrice = Number(trade.currentPrice || buyPrice);
  const sellPrice = Number(trade.sellPrice || 0);
  const buyGross = buyPrice * quantity;
  const buyFee = calculateBuyFee(buyGross);
  const buyTotal = buyGross + buyFee;
  const sellGross = sellPrice * quantity;
  const sellFee = calculateSellFee(sellGross);
  const currentGross = currentPrice * quantity;
  const netPositionValue = calculateNetSellValue(currentGross);
  const realizedPnl =
    trade.status === "closed" ? sellGross - sellFee - buyTotal : 0;
  const unrealizedPnl =
    trade.status === "entered" ? netPositionValue - buyTotal : 0;
  const pnl = trade.status === "closed" ? realizedPnl : unrealizedPnl;
  return {
    ...trade,
    buyFee,
    sellFee,
    buyGross,
    buyTotal,
    sellGross,
    netPositionValue,
    realizedPnl,
    unrealizedPnl,
    returnPct: buyTotal ? (pnl / buyTotal) * 100 : 0,
    mfePct: buyPrice
      ? ((Number(trade.highestPriceAfterEntry || buyPrice) - buyPrice) / buyPrice) * 100
      : 0,
    maePct: buyPrice
      ? ((Number(trade.lowestPriceAfterEntry || buyPrice) - buyPrice) / buyPrice) * 100
      : 0,
  };
}
export function getMetrics(state: PortfolioState) {
  const trades = state.trades.map(enrichTrade);
  const active = trades.filter((trade) => trade.status === "entered");
  const closed = trades.filter((trade) => trade.status === "closed");
  const wins = closed.filter((trade) => trade.realizedPnl > 0);
  const losses = closed.filter((trade) => trade.realizedPnl <= 0);
  const invested = active.reduce((sum, trade) => sum + trade.buyTotal, 0);
  const realized = closed.reduce((sum, trade) => sum + trade.realizedPnl, 0);
  const unrealized = active.reduce((sum, trade) => sum + trade.unrealizedPnl, 0);
  const equity = state.settings.startingCash + realized + unrealized;
  const cash = state.settings.startingCash - invested + realized;
  const grossProfit = wins.reduce((sum, trade) => sum + trade.realizedPnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.realizedPnl, 0));
  const averageWin = wins.length ? grossProfit / wins.length : 0;
  const averageLoss = losses.length ? grossLoss / losses.length : 0;
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const expectancy = (winRate / 100) * averageWin - (1 - winRate / 100) * averageLoss;
  return {
    trades, active, closed, wins, losses, invested, realized, unrealized, equity, cash,
    winRate, averageWin, averageLoss, expectancy,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit ? Infinity : 0,
  };
}

export function getEquityData(state: PortfolioState) {
  const closed = state.trades
    .map(enrichTrade)
    .filter((trade) => trade.status === "closed")
    .sort((a, b) => new Date(a.exitAt || a.createdAt).getTime() - new Date(b.exitAt || b.createdAt).getTime());
  let equity = state.settings.startingCash;
  const points: Array<{ label: string; equity: number; pnl: number; ticker?: string }> = [
    { label: "Mulai", equity, pnl: 0 },
  ];
  closed.forEach((trade) => {
    equity += trade.realizedPnl;
    points.push({
      label: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(
        new Date(trade.exitAt || trade.createdAt)
      ),
      equity,
      pnl: trade.realizedPnl,
      ticker: trade.ticker,
    });
  });
  const unrealized = state.trades
    .map(enrichTrade)
    .filter((trade) => trade.status === "entered")
    .reduce((sum, trade) => sum + trade.unrealizedPnl, 0);
  points.push({ label: "Hari ini", equity: equity + unrealized, pnl: unrealized });
  return points;
}

export const emptyState: PortfolioState = {
  settings: {
    startingCash: STARTING_CASH,
    defaultAllocation: DEFAULT_ALLOCATION,
    lotSize: DEFAULT_LOT_SIZE,
  },
  signals: [],
  trades: [],
  auditEvents: [],
};

export function createDemoState(settings = emptyState.settings): PortfolioState {
  const now = new Date("2026-07-19T08:00:00.000Z");
  const rows = [
    ["KOKA", 196, 219, 226, 186, "closed", 214, 226, 189, "tp1", -5],
    ["EPAC", 72, 79, 85, 68, "closed", 68, 78, 67, "stop_loss", -4],
    ["BUMI", 138, 149, 158, 132, "closed", 153, 157, 136, "tp1", -3],
    ["RAJA", 1800, 1950, 2080, 1710, "entered", null, 1925, 1780, "", -1],
    ["CUAN", 1275, 1390, 1480, 1210, "planned", null, 1275, 1275, "", 0],
  ] as const;

  const signals: Signal[] = [];
  const trades: Trade[] = [];
  rows.forEach(([ticker, entry, tp1, tp2, sl, status, sell, high, low, reason, dayOffset], index) => {
    const signalId = `demo_sig_${index}`;
    const tradeId = `demo_trade_${index}`;
    const createdAt = new Date(now.getTime() + dayOffset * 86400000).toISOString();
    const allocation = settings.defaultAllocation;
    const quantity = calculatePlannedQuantity(allocation, entry, settings.lotSize);
    signals.push({
      id: signalId, source: "Telegram", ticker, signalPrice: entry, tp1Price: tp1,
      tp2Price: tp2, stopLossPrice: sl, signalAt: createdAt, allocation,
      plannedQuantity: quantity, status: status as TradeStatus, createdAt,
    });
    trades.push({
      id: tradeId, signalId, ticker, status: status as TradeStatus, allocation,
      plannedEntryPrice: entry, plannedQuantity: quantity, tp1Price: tp1,
      tp2Price: tp2, stopLossPrice: sl,
      buyPrice: status === "planned" ? null : entry,
      quantity, buyFee: status === "planned" ? 0 : calculateBuyFee(entry * quantity),
      currentPrice: status === "entered" ? 1905 : Number(sell || entry),
      highestPriceAfterEntry: high, lowestPriceAfterEntry: low,
      sellPrice: sell, sellFee: sell ? calculateSellFee(sell * quantity) : 0,
      exitReason: reason,
      entryAt: status === "planned" ? null : createdAt,
      exitAt: status === "closed" ? new Date(new Date(createdAt).getTime() + 86400000).toISOString() : null,
      createdAt,
    });
  });
  return { settings, signals, trades, auditEvents: [] };
}
