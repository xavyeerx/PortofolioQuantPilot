# EDR: Next.js Portfolio Tracker

## Context

MVP static telah membuktikan alur utama pencatatan call Telegram, trade execution,
portfolio accounting, dan penyimpanan lokal. Iterasi ini meningkatkan fondasi frontend
agar dashboard lebih mudah dikembangkan dan visualisasi portfolio lebih kuat.

## Decision

Aplikasi utama dimigrasikan ke:

- Next.js 16 App Router.
- React 19 dan TypeScript.
- Tailwind CSS 4 sebagai styling pipeline.
- Recharts untuk visualisasi equity curve.
- Lucide React untuk iconography.
- Browser localStorage sebagai persistence MVP.

Data tetap menggunakan key `quantpilot.portfolio.v1` agar catatan dari MVP static
dapat dibaca oleh aplikasi baru.

## UX Direction

Dashboard menggunakan gaya operational market terminal yang tenang dan padat:

- Sidebar untuk Overview, Telegram Calls, Posisi Aktif, Trade History, dan Analytics.
- Metrics hierarchy yang memprioritaskan equity, cash, realized P/L, dan win rate.
- Equity curve interaktif.
- Capital allocation donut dan slot modal.
- Form call Telegram berbasis entry, TP1, TP2, stop loss, allocation, dan note.
- Dialog execution untuk entry, harga berjalan, highest/lowest after entry, dan exit.
- Responsive layout untuk desktop, tablet, dan mobile.

## Data Flow

1. Pengguna membuat call Telegram.
2. Sistem membuat Signal dan Trade berstatus `planned`.
3. Pengguna mencatat entry melalui execution dialog.
4. Trade berubah menjadi `entered` dan ikut unrealized accounting.
5. Update harga memperbarui highest/lowest, MFE, MAE, dan unrealized P/L.
6. Sell price menutup trade dan memperbarui realized P/L, win rate, analytics, dan
   equity curve.
7. State disimpan kembali ke localStorage.

## Scope Boundary

Versi ini belum menarik harga realtime dari provider eksternal dan belum memiliki
backend database. Harga berjalan, highest, lowest, fee, dan exit masih diinput manual.
Hal ini menjaga MVP dapat divalidasi tanpa menambah risiko data market atau operasional.

## Future Migration

Module kalkulasi di `lib/portfolio.ts` dipisahkan dari komponen UI agar persistence
dapat diganti ke database/API tanpa menulis ulang accounting dan analytics.


## Flexible Capital and Lot Sizing

Portfolio settings are user-editable and persisted with the portfolio state:

- `startingCash`
- `defaultAllocation`
- `lotSize`

Allocation is a maximum budget, not an exact buy amount. Planned quantity uses:

```text
floor(budget / (entry_price * lot_size)) * lot_size
```

For budget Rp1,000,000, entry price 196, and lot size 100, the plan is 5,100
shares (51 lots), estimated buy Rp999,600, and unused budget Rp400.

Changing settings affects new trade plans and portfolio baseline calculations. Existing
signals and executions are not resized automatically to preserve journal integrity.


## Stockbit Net Fee Accounting

Transaction fees are calculated automatically and are not editable in the execution UI.

- Stockbit buy fee: 0.15% of gross buy value.
- Stockbit sell fee: 0.25% of gross sell value.
- Fees are rounded to integer rupiah.
- Planned sizing includes buy fee so estimated debit does not exceed the call budget.
- Invested capital uses gross buy plus buy fee.
- Unrealized P/L assumes liquidation at current price and deducts both actual buy fee
  and estimated sell fee.
- Realized P/L deducts both buy and sell fee.
- Return percentage uses total buy debit including fee as its denominator.

Stamp duty and monthly live-data fees are excluded because they depend on aggregate
daily or monthly account activity and cannot be attributed reliably to one trade.
