"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Check,
  ChevronRight, CircleDollarSign, Clock3, History, LayoutDashboard,
  Menu, Plus, RotateCcw, Settings2, Target, Trash2, TrendingUp, WalletCards, X,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  calculateBuyFee, calculateSellFee, createDemoState, emptyState, enrichTrade, formatDate,
  formatIDR, formatPct, getEquityData, getMetrics, id, PortfolioState,
  STORAGE_KEY, Trade,
} from "@/lib/portfolio";

type View = "dashboard" | "positions" | "history" | "analytics";

const navItems = [
  { id: "dashboard" as View, label: "Overview", icon: LayoutDashboard },
  { id: "positions" as View, label: "Posisi Aktif", icon: Activity },
  { id: "history" as View, label: "Trade History", icon: History },
  { id: "analytics" as View, label: "Analytics", icon: BarChart3 },
];

const numberValue = (data: FormData, key: string) => Number(data.get(key) || 0);
const localDateTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

function StatusBadge({ status }: { status: Trade["status"] }) {
  const labels = { planned: "Rencana", entered: "Aktif", closed: "Selesai", skipped: "Dilewati" };
  return <span className={`status status-${status}`}><i />{labels[status]}</span>;
}

function PnlValue({ value, percent }: { value: number; percent?: number }) {
  const positive = value >= 0;
  return (
    <div className={positive ? "pnl positive" : "pnl negative"}>
      <span>{formatIDR(value)}</span>
      {percent !== undefined && <small>{formatPct(percent)}</small>}
    </div>
  );
}

function MetricCard({
  label, value, note, trend, icon: Icon,
}: {
  label: string; value: string; note: string; trend?: number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <div className="metric-icon"><Icon size={17} strokeWidth={1.8} /></div>
      </div>
      <strong>{value}</strong>
      <div className="metric-note">
        {trend !== undefined && (
          <span className={trend >= 0 ? "trend-up" : "trend-down"}>
            {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {formatPct(trend)}
          </span>
        )}
        <span>{note}</span>
      </div>
    </article>
  );
}

function EmptyState({ onAdd, title }: { onAdd: () => void; title: string }) {
  return (
    <div className="empty-state">
      <div><Target size={22} /></div>
      <strong>{title}</strong>
      <p>Catat trade pertama untuk mulai membangun riwayat performa.</p>
      <button className="secondary-button" onClick={onAdd}><Plus size={16} /> Tambah trade</button>
    </div>
  );
}

export function PortfolioDashboard() {
  const [state, setState] = useState<PortfolioState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as PortfolioState;
          setState({
            ...parsed,
            settings: { ...emptyState.settings, ...parsed.settings },
          });
        }
      } catch {
        setState(emptyState);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const metrics = useMemo(() => getMetrics(state), [state]);
  const equityData = useMemo(() => getEquityData(state), [state]);
  const portfolioReturn = ((metrics.equity - state.settings.startingCash) / state.settings.startingCash) * 100;
  const utilization = Math.min(100, (metrics.invested / state.settings.startingCash) * 100);

  function addTrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const ticker = String(data.get("ticker") || "").trim().toUpperCase();
    const buyPrice = numberValue(data, "buyPrice");
    const quantity = numberValue(data, "quantity");
    const currentPrice = numberValue(data, "currentPrice") || buyPrice;
    const sellPrice = numberValue(data, "sellPrice") || null;
    const entryAt = String(data.get("entryAt") || new Date().toISOString());
    if (!ticker || buyPrice <= 0 || quantity <= 0) return;

    const highest = Math.max(numberValue(data, "highestPrice"), currentPrice, buyPrice, sellPrice || 0);
    const lowestInput = numberValue(data, "lowestPrice");
    const lowest = Math.min(lowestInput || buyPrice, currentPrice, buyPrice, sellPrice || buyPrice);
    const status: Trade["status"] = sellPrice ? "closed" : "entered";
    const trade: Trade = {
      id: id("trd"), signalId: id("manual"), ticker, status,
      allocation: buyPrice * quantity, plannedEntryPrice: buyPrice,
      plannedQuantity: quantity, tp1Price: numberValue(data, "tp1") || null,
      tp2Price: numberValue(data, "tp2") || null,
      stopLossPrice: numberValue(data, "stopLoss") || null,
      buyPrice, quantity, buyFee: calculateBuyFee(buyPrice * quantity),
      currentPrice: sellPrice || currentPrice,
      highestPriceAfterEntry: highest, lowestPriceAfterEntry: lowest,
      sellPrice, sellFee: sellPrice ? calculateSellFee(sellPrice * quantity) : 0,
      exitReason: String(data.get("exitReason") || ""),
      entryAt, exitAt: sellPrice ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
    };
    setState((current) => ({ ...current, trades: [trade, ...current.trades] }));
    setShowAddTrade(false);
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const startingCash = numberValue(data, "startingCash");
    const defaultAllocation = numberValue(data, "defaultAllocation");
    const lotSize = numberValue(data, "lotSize");
    if (startingCash <= 0 || defaultAllocation <= 0 || lotSize <= 0) return;
    setState((current) => ({
      ...current,
      settings: { startingCash, defaultAllocation, lotSize },
    }));
    setShowSettings(false);
    setConfirmReset(false);
  }

  function resetPortfolioData() {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(emptyState);
    setConfirmReset(false);
    setShowSettings(false);
    setView("dashboard");
  }

  function saveTrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTrade) return;
    const data = new FormData(event.currentTarget);
    const buyPrice = numberValue(data, "buyPrice");
    const quantity = numberValue(data, "quantity");
    const currentPrice = numberValue(data, "currentPrice") || buyPrice;
    const sellPrice = numberValue(data, "sellPrice") || null;
    const highest = Math.max(numberValue(data, "highestPrice"), currentPrice, buyPrice);
    const lowestInput = numberValue(data, "lowestPrice");
    const lowest = Math.min(lowestInput || buyPrice, currentPrice, buyPrice);
    const nextStatus: Trade["status"] = sellPrice ? "closed" : "entered";
    const updated: Trade = {
      ...editingTrade, status: nextStatus, buyPrice, quantity, currentPrice,
      highestPriceAfterEntry: highest, lowestPriceAfterEntry: lowest,
      buyFee: calculateBuyFee(buyPrice * quantity), sellPrice,
      sellFee: sellPrice ? calculateSellFee(sellPrice * quantity) : 0,
      exitReason: String(data.get("exitReason") || ""),
      entryAt: editingTrade.entryAt || new Date().toISOString(),
      exitAt: sellPrice ? new Date().toISOString() : null,
    };
    setState((current) => ({
      ...current,
      trades: current.trades.map((trade) => trade.id === updated.id ? updated : trade),
      signals: current.signals.map((signal) =>
        signal.id === updated.signalId ? { ...signal, status: nextStatus } : signal
      ),
    }));
    setEditingTrade(null);
  }


  return (
    <div className="app-frame">
      <aside className={mobileNav ? "sidebar sidebar-open" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark"><TrendingUp size={21} /></div>
          <div><strong>QuantPilot</strong><span>PORTFOLIO OS</span></div>
          <button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Tutup menu"><X /></button>
        </div>

        <nav>
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              onClick={() => { setView(item.id); setMobileNav(false); }}
            >
              <item.icon size={18} /><span>{item.label}</span>
              {item.id === "positions" && metrics.active.length > 0 && <b>{metrics.active.length}</b>}
            </button>
          ))}
        </nav>

        <div className="capital-panel">
          <div className="capital-head"><span>Modal awal</span><button onClick={() => setShowSettings(true)} title="Edit modal"><Settings2 size={14} /></button></div>
          <strong>{formatIDR(state.settings.startingCash)}</strong>
          <div className="capital-track"><i style={{ width: `${utilization}%` }} /></div>
          <div className="capital-meta"><span>{formatPct(utilization)} terpakai</span><span>{formatIDR(metrics.invested, true)}</span></div>
        </div>
        <div className="sidebar-footer"><span className="live-dot" /> Data tersimpan lokal</div>
      </aside>
      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="Tutup menu" />}

      <main>
        <header className="topbar">
          <div className="topbar-title">
            <button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Buka menu"><Menu /></button>
            <div>
              <span className="eyebrow">Portfolio workspace</span>
              <h1>{navItems.find((item) => item.id === view)?.label}</h1>
            </div>
          </div>
          <div className="top-actions">
            <div className="market-status"><span /> IDX Market Closed</div>
            <button className="icon-button" title="Pengaturan portfolio" aria-label="Pengaturan portfolio" onClick={() => setShowSettings(true)}><Settings2 size={18} /></button>
            <button className="primary-button" onClick={() => setShowAddTrade(true)}><Plus size={17} /> Tambah Trade</button>
          </div>
        </header>

        <div className="content">
          {view === "dashboard" && (
            <>
              <section className="welcome-row">
                <div><h2>Selamat datang kembali.</h2><p>Ringkasan performa portfolio per {formatDate(new Date().toISOString())}.</p></div>
                {state.trades.length === 0 && (
                  <button className="text-button" onClick={() => setState(createDemoState(state.settings))}>
                    <RotateCcw size={15} /> Gunakan data demo
                  </button>
                )}
              </section>

              <section className="metrics-grid">
                <MetricCard label="Total Equity" value={formatIDR(metrics.equity)} note="dari modal awal" trend={portfolioReturn} icon={CircleDollarSign} />
                <MetricCard label="Available Cash" value={formatIDR(metrics.cash)} note={`${Math.max(0, Math.floor(metrics.cash / state.settings.defaultAllocation))} slot tersedia`} icon={WalletCards} />
                <MetricCard label="Net Realized P/L" value={formatIDR(metrics.realized)} note={`${metrics.closed.length} trade selesai`} trend={(metrics.realized / state.settings.startingCash) * 100} icon={Check} />
                <MetricCard label="Win Rate" value={`${metrics.winRate.toFixed(1)}%`} note={`${metrics.wins.length} menang dari ${metrics.closed.length}`} icon={Target} />
              </section>

              <section className="dashboard-grid">
                <article className="panel chart-panel">
                  <div className="panel-heading">
                    <div><span className="section-kicker">Performance</span><h3>Perkembangan Equity</h3></div>
                    <div className="chart-legend"><i /> Equity curve</div>
                  </div>
                  <div className="chart-summary">
                    <strong>{formatIDR(metrics.equity)}</strong>
                    <span className={portfolioReturn >= 0 ? "trend-up" : "trend-down"}>{formatPct(portfolioReturn)} all time</span>
                  </div>
                  <div className="equity-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={equityData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#26a269" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#26a269" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#e8ebe6" strokeDasharray="3 5" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7b8179", fontSize: 11 }} />
                        <YAxis hide domain={["dataMin - 150000", "dataMax + 150000"]} />
                        <Tooltip
                          cursor={{ stroke: "#aab2a7", strokeDasharray: "3 3" }}
                          formatter={(value) => [formatIDR(Number(value)), "Equity"]}
                          contentStyle={{ borderRadius: 6, border: "1px solid #dfe3dc", boxShadow: "0 12px 32px rgba(31,42,34,.1)", fontSize: 12 }}
                        />
                        <Area type="monotone" dataKey="equity" stroke="#16794d" strokeWidth={2.5} fill="url(#equityFill)" activeDot={{ r: 5, fill: "#16794d", stroke: "#fff", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="panel allocation-panel">
                  <div className="panel-heading"><div><span className="section-kicker">Capital</span><h3>Alokasi Dana</h3></div></div>
                  <div className="allocation-visual">
                    <div className="donut" style={{ background: `conic-gradient(#173e2d 0 ${utilization}%, #dfe8df ${utilization}% 100%)` }}>
                      <div><strong>{utilization.toFixed(0)}%</strong><span>terpakai</span></div>
                    </div>
                  </div>
                  <div className="allocation-list">
                    <div><span><i className="legend-invested" />Invested incl. fee</span><strong>{formatIDR(metrics.invested)}</strong></div>
                    <div><span><i className="legend-cash" />Available</span><strong>{formatIDR(metrics.cash)}</strong></div>
                    <div><span><i className="legend-profit" />Net Unrealized P/L</span><strong className={metrics.unrealized >= 0 ? "positive" : "negative"}>{formatIDR(metrics.unrealized)}</strong></div>
                  </div>
                </article>
              </section>

              <TradeTable
                title="Posisi Aktif"
                subtitle="Pantau jarak harga terhadap target dan risiko."
                trades={metrics.active}
                lotSize={state.settings.lotSize}
                onEdit={setEditingTrade}
                onAdd={() => setShowAddTrade(true)}
              />
            </>
          )}


          {view === "positions" && (
            <TradeTable title="Posisi Aktif" subtitle="Update harga berjalan, highest price, TP, dan stop loss." trades={metrics.active} lotSize={state.settings.lotSize} onEdit={setEditingTrade} onAdd={() => setShowAddTrade(true)} />
          )}

          {view === "history" && (
            <TradeTable title="Trade History" subtitle="Hasil aktual seluruh posisi yang sudah ditutup." trades={metrics.closed} lotSize={state.settings.lotSize} onEdit={setEditingTrade} onAdd={() => setShowAddTrade(true)} />
          )}

          {view === "analytics" && (
            <Analytics state={state} />
          )}
        </div>
      </main>

      {showSettings && (
        <div className="modal-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && (setShowSettings(false), setConfirmReset(false))}>
          <section className="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="modal-head">
              <div><span className="section-kicker">Portfolio configuration</span><h2 id="settings-title">Pengaturan modal</h2><p>Atur dasar perhitungan portfolio dan rencana entry.</p></div>
              <button className="icon-button" onClick={() => { setShowSettings(false); setConfirmReset(false); }} aria-label="Tutup"><X /></button>
            </div>
            <form onSubmit={saveSettings}>
              <div className="settings-summary">
                <div><CircleDollarSign size={18} /><span><small>Modal sekarang</small><strong>{formatIDR(state.settings.startingCash)}</strong></span></div>
                <div><Target size={18} /><span><small>Default per trade</small><strong>{formatIDR(state.settings.defaultAllocation)}</strong></span></div>
              </div>
              <div className="form-grid">
                <label><span>Modal Awal</span><input name="startingCash" type="number" min="1" defaultValue={state.settings.startingCash} required /></label>
                <label><span>Budget Default per Trade</span><input name="defaultAllocation" type="number" min="1" defaultValue={state.settings.defaultAllocation} required /></label>
                <label className="wide-field"><span>Ukuran 1 Lot <small>IDX reguler: 100 lembar</small></span><input name="lotSize" type="number" min="1" step="1" defaultValue={state.settings.lotSize} required /></label>
              </div>
              <div className="settings-notice"><Settings2 size={16} /><span><strong>Fee Stockbit dihitung otomatis.</strong> Buy 0,15% dan sell 0,25%. Nilai P/L, equity, cash, serta estimasi entry sudah bersih dari fee transaksi.</span></div>
              <div className="danger-zone">
                <div><AlertTriangle size={17} /><span><strong>Reset data portfolio</strong><small>Menghapus semua posisi, trade history, dan mengembalikan modal ke default.</small></span></div>
                {confirmReset ? (
                  <div className="danger-actions">
                    <button type="button" className="secondary-button" onClick={() => setConfirmReset(false)}>Batal</button>
                    <button type="button" className="danger-button" onClick={resetPortfolioData}><Trash2 size={16} /> Ya, reset</button>
                  </div>
                ) : (
                  <button type="button" className="danger-button subtle" onClick={() => setConfirmReset(true)}><Trash2 size={16} /> Reset Data</button>
                )}
              </div>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => { setShowSettings(false); setConfirmReset(false); }}>Batal</button><button className="primary-button" type="submit"><Check size={17} /> Simpan Pengaturan</button></div>
            </form>
          </section>
        </div>
      )}
      {showAddTrade && (
        <div className="modal-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setShowAddTrade(false)}>
          <section className="modal call-modal" role="dialog" aria-modal="true" aria-labelledby="add-trade-title">
            <div className="modal-head">
              <div><span className="section-kicker">Trade journal</span><h2 id="add-trade-title">Tambah trade</h2><p>Isi eksekusi entry, harga berjalan, atau langsung tutup sebagai history.</p></div>
              <button className="icon-button" onClick={() => setShowAddTrade(false)} aria-label="Tutup"><X /></button>
            </div>
            <form onSubmit={addTrade}>
              <div className="form-grid">
                <label className="ticker-field"><span>Ticker</span><input name="ticker" placeholder="KOKA" required autoFocus /></label>
                <label><span>Waktu Entry</span><input name="entryAt" type="datetime-local" defaultValue={localDateTime()} /></label>
                <label><span>Buy Price</span><input name="buyPrice" type="number" min="1" placeholder="196" required /></label>
                <label><span>Quantity <small>kelipatan {state.settings.lotSize}</small></span><input name="quantity" type="number" min={state.settings.lotSize} step={state.settings.lotSize} placeholder="5000" required /></label>
                <label><span>Target TP1</span><input name="tp1" type="number" min="1" placeholder="219" /></label>
                <label><span>Target TP2</span><input name="tp2" type="number" min="1" placeholder="226" /></label>
                <label><span>Stop Loss</span><input name="stopLoss" type="number" min="1" placeholder="186" /></label><label><span>Current Price</span><input name="currentPrice" type="number" min="1" placeholder="214" /></label><label><span>Highest After Entry</span><input name="highestPrice" type="number" min="1" placeholder="226" /></label><label><span>Lowest After Entry</span><input name="lowestPrice" type="number" min="1" placeholder="189" /></label><label><span>Sell Price <small>isi kalau sudah exit</small></span><input name="sellPrice" type="number" min="1" /></label><label className="wide-field"><span>Exit Reason</span><select name="exitReason" defaultValue=""><option value="">Belum exit</option><option value="tp1">TP1</option><option value="tp2">TP2</option><option value="stop_loss">Stop loss</option><option value="manual">Manual</option><option value="time_exit">Time exit</option></select></label>
              </div>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowAddTrade(false)}>Batal</button><button className="primary-button" type="submit"><Plus size={17} /> Simpan Trade</button></div>
            </form>
          </section>
        </div>
      )}

      {editingTrade && (
        <div className="modal-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setEditingTrade(null)}>
          <section className="modal trade-modal" role="dialog" aria-modal="true" aria-labelledby="edit-trade-title">
            <div className="modal-head">
              <div><span className="section-kicker">Execution journal</span><h2 id="edit-trade-title">{editingTrade.ticker} Trade</h2><p>Update eksekusi, pergerakan harga, atau tutup posisi.</p></div>
              <button className="icon-button" onClick={() => setEditingTrade(null)} aria-label="Tutup"><X /></button>
            </div>
            <form onSubmit={saveTrade}>
              <div className="form-grid">
                <label><span>Buy Price</span><input name="buyPrice" type="number" min="1" defaultValue={editingTrade.buyPrice || editingTrade.plannedEntryPrice} required /></label>
                <label><span>Quantity <small>kelipatan {state.settings.lotSize}</small></span><input name="quantity" type="number" min={state.settings.lotSize} step={state.settings.lotSize} defaultValue={editingTrade.quantity || editingTrade.plannedQuantity} required /></label>
                <label><span>Current Price</span><input name="currentPrice" type="number" min="1" defaultValue={editingTrade.currentPrice || editingTrade.plannedEntryPrice} /></label>
                                <label><span>Highest After Entry</span><input name="highestPrice" type="number" min="1" defaultValue={editingTrade.highestPriceAfterEntry || editingTrade.plannedEntryPrice} /></label>
                <label><span>Lowest After Entry</span><input name="lowestPrice" type="number" min="1" defaultValue={editingTrade.lowestPriceAfterEntry || editingTrade.plannedEntryPrice} /></label>
                <label><span>Sell Price <small>isi untuk close</small></span><input name="sellPrice" type="number" min="1" defaultValue={editingTrade.sellPrice || ""} /></label>
                                <label className="wide-field"><span>Exit Reason</span><select name="exitReason" defaultValue={editingTrade.exitReason || ""}><option value="">Belum exit</option><option value="tp1">TP1</option><option value="tp2">TP2</option><option value="stop_loss">Stop loss</option><option value="manual">Manual</option><option value="time_exit">Time exit</option></select></label>
              </div>
              <div className="level-strip"><span>TP1 <b>{editingTrade.tp1Price || "-"}</b></span><span>TP2 <b>{editingTrade.tp2Price || "-"}</b></span><span>SL <b>{editingTrade.stopLossPrice || "-"}</b></span></div>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditingTrade(null)}>Batal</button><button className="primary-button" type="submit"><Check size={17} /> Simpan Trade</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function TradeTable({
  title, subtitle, trades, lotSize, onEdit, onAdd,
}: {
  title: string; subtitle: string; trades: ReturnType<typeof enrichTrade>[]; lotSize: number;
  onEdit: (trade: Trade) => void; onAdd: () => void;
}) {
  return (
    <section className="panel full-panel">
      <div className="panel-heading">
        <div><span className="section-kicker">Execution</span><h3>{title}</h3><p>{subtitle}</p></div>
        <span className="count-badge">{trades.length} posisi</span>
      </div>
      {trades.length === 0 ? <EmptyState onAdd={onAdd} title={`Belum ada ${title.toLowerCase()}`} /> : (
        <div className="table-scroll">
          <table>
            <thead><tr><th>Saham</th><th>Entry / Qty</th><th>Harga</th><th>Level</th><th>Highest</th><th>MFE / MAE</th><th>Net P/L</th><th /></tr></thead>
            <tbody>
              {trades.map((trade) => {
                const pnl = trade.status === "closed" ? trade.realizedPnl : trade.unrealizedPnl;
                return (
                  <tr key={trade.id}>
                    <td><div className="ticker-cell"><strong>{trade.ticker}</strong><StatusBadge status={trade.status} /></div></td>
                    <td><strong className="mono">{trade.buyPrice || trade.plannedEntryPrice}</strong><small>{trade.quantity / lotSize} lot · {trade.quantity} lembar / total {formatIDR(trade.buyTotal)}</small></td>
                    <td><strong className="mono">{trade.sellPrice || trade.currentPrice}</strong><small>{trade.status === "closed" ? "Sell price" : "Current"}</small></td>
                    <td><div className="levels"><span className="tp">TP {trade.tp1Price || "-"}</span><span className="sl">SL {trade.stopLossPrice || "-"}</span></div></td>
                    <td><strong className="mono">{trade.highestPriceAfterEntry}</strong><small>after entry</small></td>
                    <td><div className="excursion"><span>{formatPct(trade.mfePct)}</span><span>{formatPct(trade.maePct)}</span></div></td>
                    <td><PnlValue value={pnl} percent={trade.returnPct} /></td>
                    <td><button className="row-action" onClick={() => onEdit(trade)}>{trade.status === "planned" ? "Catat entry" : "Update"}<ChevronRight size={14} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Analytics({ state }: { state: PortfolioState }) {
  const m = getMetrics(state);
  const avgMfe = m.trades.length ? m.trades.reduce((sum, trade) => sum + trade.mfePct, 0) / m.trades.length : 0;
  const avgMae = m.trades.length ? m.trades.reduce((sum, trade) => sum + trade.maePct, 0) / m.trades.length : 0;
  const tpHits = m.closed.filter((trade) => ["tp1", "tp2"].includes(trade.exitReason)).length;
  const slHits = m.closed.filter((trade) => trade.exitReason === "stop_loss").length;
  return (
    <>
      <section className="metrics-grid">
        <MetricCard label="Expectancy / Trade" value={formatIDR(m.expectancy)} note="nilai harapan statistik" icon={TrendingUp} />
        <MetricCard label="Average Win" value={formatIDR(m.averageWin)} note={`${m.wins.length} winning trades`} icon={ArrowUpRight} />
        <MetricCard label="Average Loss" value={formatIDR(m.averageLoss)} note={`${m.losses.length} losing trades`} icon={ArrowDownRight} />
        <MetricCard label="Profit Factor" value={Number.isFinite(m.profitFactor) ? m.profitFactor.toFixed(2) : "∞"} note="gross profit / loss" icon={BarChart3} />
      </section>
      <section className="analytics-grid">
        <article className="panel">
          <div className="panel-heading"><div><span className="section-kicker">Outcome</span><h3>Win / Loss Distribution</h3></div></div>
          <div className="winrate-hero"><strong>{m.winRate.toFixed(1)}%</strong><span>win rate</span></div>
          <div className="distribution-bar"><i style={{ width: `${m.winRate}%` }} /></div>
          <div className="distribution-labels"><span><i className="win-dot" />{m.wins.length} Win</span><span><i className="loss-dot" />{m.losses.length} Loss</span></div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><span className="section-kicker">Price excursion</span><h3>Potensi vs Risiko</h3></div></div>
          <div className="analytics-stat"><div><span>Average MFE</span><strong className="positive">{formatPct(avgMfe)}</strong></div><p>Rata-rata kenaikan tertinggi setelah entry.</p></div>
          <div className="analytics-stat"><div><span>Average MAE</span><strong className="negative">{formatPct(avgMae)}</strong></div><p>Rata-rata tekanan turun setelah entry.</p></div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><span className="section-kicker">Exit quality</span><h3>Alasan Keluar</h3></div></div>
          <div className="exit-row"><span><Target size={16} /> Target tercapai</span><strong>{tpHits}</strong></div>
          <div className="exit-row"><span><ArrowDownRight size={16} /> Stop loss</span><strong>{slHits}</strong></div>
          <div className="exit-row"><span><Clock3 size={16} /> Manual / lainnya</span><strong>{Math.max(0, m.closed.length - tpHits - slHits)}</strong></div>
        </article>
      </section>
    </>
  );
}
