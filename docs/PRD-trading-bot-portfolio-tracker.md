# PRD: Realtime Trading Bot Portfolio Tracker

## 1. Ringkasan

QuantPilot membutuhkan website portofolio untuk mencatat, memonitor, dan mengevaluasi
setiap call dari bot trading realtime. Produk ini harus membantu pengguna melacak
riwayat entry, posisi aktif, target price, stop loss, harga tertinggi setelah dibeli,
harga jual, profit/loss, win rate, dan kualitas performa bot dari waktu ke waktu.

Tujuan utama bukan hanya mengetahui profit atau loss, tetapi memisahkan kualitas signal,
kualitas eksekusi, hasil pasar, dan disiplin manajemen risiko.

## 2. Konteks

### Fakta yang Diketahui

- Pengguna memiliki bot trading realtime yang menghasilkan call saham.
- Contoh signal berisi:
  - Tipe signal: `STRONG BUY SIGNAL`
  - Waktu signal: contoh `17 Jul 2026, 15:07 WIB`
  - Ticker: contoh `KOKA`, `EPAC`
  - Harga call atau entry reference: contoh `196`, `72`
  - Persentase perubahan saat signal: contoh `+14.6%`, `+2.9%`
  - Score: contoh `80`, `81`
  - Strategi/kondisi: contoh `ST-CONT`, `2 bar di atas supertrend`, `volume`, `Mkt:BULL`
  - Volume multiplier: contoh `Vol: 2.6x`, `2.7x`
  - Take profit levels: `TP1`, `TP2`
  - Stop loss: `SL`
- Modal awal pengguna: Rp20.000.000.
- Alokasi per call: Rp1.000.000.
- Pengguna ingin tracking performa bot, history entry, harga tertinggi setelah beli,
  harga jual, pendapatan, win rate, dan visualisasi.

### Observasi

- Signal bot kemungkinan berasal dari chat/Telegram/WhatsApp atau sistem notifikasi
  yang format teksnya konsisten.
- Pengguna membutuhkan sistem jurnal trading sekaligus dashboard performa.
- Metrik harus dapat membedakan open trade, closed trade, hit TP, hit SL, manual sell,
  missed entry, dan signal yang tidak dieksekusi.

### Asumsi Awal

- Market yang dilacak adalah saham Indonesia/IDX.
- Harga real-time atau delayed price dapat diambil dari provider eksternal atau input
  manual pada versi awal.
- Satu signal dapat menghasilkan satu rencana trade.
- Satu rencana trade dapat memiliki nol atau lebih transaksi aktual, karena pengguna
  mungkin tidak selalu entry.
- Alokasi Rp1.000.000 adalah default, tetapi perlu bisa diubah per trade.
- Fee broker, pajak, dan slippage perlu dicatat agar P/L bersih akurat.

### Unknown

- Sumber data signal bot: API, database, webhook, file, atau chat export.
- Sumber harga saham yang tersedia dan legal untuk digunakan.
- Apakah eksekusi beli/jual dilakukan manual atau melalui broker API.
- Apakah pengguna ingin multi-user, single-user, atau private local dashboard.
- Apakah perlu integrasi notifikasi realtime.

## 3. Problem Framing

### Masalah Utama

Pengguna belum memiliki sistem terstruktur untuk membuktikan apakah bot trading realtime
benar-benar menghasilkan edge. Tanpa pencatatan yang rapi, pengguna sulit mengetahui:

- Signal mana yang profitable.
- Apakah profit berasal dari kualitas strategi atau kebetulan market.
- Apakah loss berasal dari signal buruk, eksekusi telat, tidak disiplin SL, atau kondisi
  pasar.
- Berapa performa aktual dengan modal dan sizing yang realistis.
- Apakah bot lebih baik dihentikan, diperbaiki, atau diperbesar modalnya.

### Dampak

- Evaluasi performa bot menjadi subjektif.
- Risiko overconfidence saat beberapa trade profit.
- Risiko memperbesar modal tanpa evidence.
- Sulit melakukan post-trade review dan improvement strategi.
- Sulit membedakan signal bagus yang tidak dieksekusi dari signal buruk yang dieksekusi.

## 4. Tujuan Produk

### Goals

- Mencatat semua signal bot secara historis.
- Melacak trade plan dan trade execution secara terpisah.
- Menghitung performa portofolio berdasarkan modal Rp20.000.000 dan alokasi default
  Rp1.000.000 per call.
- Menampilkan posisi aktif dan closed trades.
- Mencatat harga tertinggi setelah entry dan maksimum potensi profit.
- Mencatat harga jual aktual dan realized profit/loss.
- Mengukur win rate, average return, total return, drawdown, hit TP rate, hit SL rate,
  dan expectancy.
- Menyediakan visualisasi performa yang mudah dibaca.
- Membantu pengguna mengevaluasi kualitas bot, bukan hanya melihat nominal profit.

### Non-Goals untuk Versi Awal

- Auto trading langsung ke broker.
- Rekomendasi beli/jual otomatis di luar signal bot yang sudah ada.
- Backtesting penuh multi-tahun.
- Optimasi strategi bot.
- Prediksi harga saham.
- Menjamin profit.

## 5. Persona

### Primary User

Pemilik bot trading yang ingin mengevaluasi performa signal secara disiplin dan berbasis
data.

### Secondary User

Developer/quant researcher yang ingin melihat pola kelemahan strategi, misalnya signal
terlalu telat, TP terlalu jauh, SL terlalu ketat, atau performa buruk pada kondisi market
tertentu.

## 6. User Journey

1. Bot mengirim signal `STRONG BUY`.
2. Sistem menerima atau pengguna memasukkan signal.
3. Sistem membuat trade plan dengan ticker, signal price, TP, SL, score, strategy tags,
   dan alokasi default Rp1.000.000.
4. Pengguna menandai apakah trade dieksekusi.
5. Jika dieksekusi, pengguna mencatat actual buy price, quantity, fee, dan waktu entry.
6. Sistem memantau harga berjalan atau pengguna update harga manual.
7. Sistem menyimpan highest price after entry, unrealized P/L, dan status TP/SL.
8. Saat dijual, pengguna mencatat sell price, quantity, fee, waktu exit, dan alasan exit.
9. Sistem menghitung realized P/L, return, holding period, MAE/MFE, dan outcome.
10. Dashboard menampilkan performa agregat dan insight.

## 7. Functional Requirements

### 7.1 Signal Capture

Sistem harus dapat mencatat signal dengan field:

- Signal ID
- Source
- Signal timestamp
- Ticker
- Signal type
- Signal price
- Price change percentage at signal
- Score
- Market condition
- Strategy tags
- Volume multiplier
- TP1 price
- TP1 percentage
- TP2 price
- TP2 percentage
- Stop loss price
- Stop loss percentage
- Raw message
- Created timestamp

### 7.2 Trade Plan

Sistem harus membuat trade plan dari signal dengan field:

- Trade plan ID
- Linked signal ID
- Planned capital allocation
- Planned entry price
- Planned quantity estimate
- Risk per share
- Planned maximum loss
- Planned TP1 gain
- Planned TP2 gain
- Risk/reward ratio
- Execution status: `not_executed`, `entered`, `skipped`, `expired`
- Notes

### 7.3 Trade Execution

Sistem harus mencatat eksekusi aktual:

- Entry timestamp
- Buy price
- Buy quantity
- Buy gross amount
- Buy fee
- Average entry price
- Exit timestamp
- Sell price
- Sell quantity
- Sell gross amount
- Sell fee
- Realized P/L gross
- Realized P/L net
- Realized return percentage
- Exit reason: `tp1`, `tp2`, `stop_loss`, `manual`, `time_exit`, `bot_update`
- Holding period

### 7.4 Price Tracking

Untuk setiap posisi yang sudah entry, sistem harus melacak:

- Current price
- Highest price after entry
- Lowest price after entry
- Maximum favorable excursion (MFE)
- Maximum adverse excursion (MAE)
- Distance to TP1
- Distance to TP2
- Distance to SL
- Unrealized P/L
- Unrealized return percentage

### 7.5 Portfolio Accounting

Sistem harus menghitung:

- Starting cash: Rp20.000.000
- Available cash
- Allocated capital
- Invested capital
- Realized P/L
- Unrealized P/L
- Total equity
- Cash utilization
- Number of active positions
- Number of available slots based on Rp1.000.000 per call

### 7.6 Performance Analytics

Sistem harus menyediakan metrik:

- Total signals
- Executed trades
- Skipped signals
- Open trades
- Closed trades
- Winning trades
- Losing trades
- Win rate
- Loss rate
- Average win
- Average loss
- Profit factor
- Expectancy per trade
- Total realized return
- Total unrealized return
- Maximum drawdown
- Average holding period
- TP1 hit rate
- TP2 hit rate
- Stop loss hit rate
- Average MFE
- Average MAE
- Missed opportunity from skipped signals

### 7.7 Visualisasi

Dashboard harus menampilkan:

- Equity curve
- Realized vs unrealized P/L
- Win/loss distribution
- P/L by ticker
- P/L by strategy tag
- P/L by score bucket
- Signal outcome funnel: signal -> entered -> TP/SL/manual exit
- Active position table
- Trade history table
- MFE vs realized return scatter plot
- Calendar or timeline of trades

### 7.8 Filtering and Segmentation

Pengguna harus bisa filter berdasarkan:

- Date range
- Ticker
- Signal type
- Score range
- Market condition
- Strategy tag
- Outcome
- Exit reason
- Open vs closed

### 7.9 Manual Correction

Sistem harus mengizinkan koreksi data dengan audit trail:

- Edit signal fields
- Edit execution price
- Edit quantity
- Edit fees
- Edit exit reason
- Add notes
- Mark signal as invalid

Setiap perubahan penting harus menyimpan:

- Previous value
- New value
- Changed by
- Changed timestamp
- Change reason

## 8. Data Model Awal

### Entity: Signal

- `id`
- `source`
- `raw_message`
- `signal_type`
- `ticker`
- `signal_price`
- `price_change_pct`
- `score`
- `market_condition`
- `strategy_tags`
- `volume_multiplier`
- `tp1_price`
- `tp1_pct`
- `tp2_price`
- `tp2_pct`
- `stop_loss_price`
- `stop_loss_pct`
- `signal_at`
- `created_at`

### Entity: TradePlan

- `id`
- `signal_id`
- `planned_allocation`
- `planned_entry_price`
- `planned_quantity`
- `planned_risk_amount`
- `planned_tp1_profit`
- `planned_tp2_profit`
- `risk_reward_ratio`
- `status`
- `notes`
- `created_at`
- `updated_at`

### Entity: TradeExecution

- `id`
- `trade_plan_id`
- `entry_at`
- `buy_price`
- `quantity`
- `buy_fee`
- `exit_at`
- `sell_price`
- `sell_fee`
- `exit_reason`
- `realized_pnl`
- `realized_return_pct`
- `status`
- `created_at`
- `updated_at`

### Entity: PriceSnapshot

- `id`
- `ticker`
- `price`
- `snapshot_at`
- `source`

### Entity: TradeMetricSnapshot

- `id`
- `trade_execution_id`
- `current_price`
- `highest_price_after_entry`
- `lowest_price_after_entry`
- `mfe_pct`
- `mae_pct`
- `unrealized_pnl`
- `snapshot_at`

### Entity: PortfolioSnapshot

- `id`
- `cash`
- `invested_capital`
- `realized_pnl`
- `unrealized_pnl`
- `total_equity`
- `snapshot_at`

## 9. Calculation Rules

### Position Sizing

- Default allocation per call: Rp1.000.000.
- Planned quantity:

```text
floor(planned_allocation / planned_entry_price)
```

- Actual gross buy:

```text
buy_price * quantity
```

### Profit/Loss

- Gross realized P/L:

```text
(sell_price - buy_price) * quantity
```

- Net realized P/L:

```text
gross_realized_pnl - buy_fee - sell_fee
```

- Return percentage:

```text
net_realized_pnl / (buy_price * quantity) * 100
```

### MFE and MAE

- MFE:

```text
(highest_price_after_entry - buy_price) / buy_price * 100
```

- MAE:

```text
(lowest_price_after_entry - buy_price) / buy_price * 100
```

### Win Rate

```text
winning_closed_trades / closed_trades * 100
```

Trade dianggap win jika `net_realized_pnl > 0`.

### Expectancy

```text
(win_rate * average_win) - (loss_rate * average_loss)
```

Dengan `win_rate` dan `loss_rate` dalam desimal, bukan persen.

## 10. MVP Scope

### Must Have

- Input manual call dari Telegram.
- Catat ticker, entry price, TP1, TP2, stop loss, allocation, dan catatan Telegram opsional.
- Trade plan otomatis dari input call manual.
- Modal awal Rp20.000.000 dan alokasi default Rp1.000.000.
- Input manual eksekusi beli dan jual.
- Tracking open/closed trade.
- Hitung realized P/L, unrealized P/L, win rate, return, MFE, MAE.
- Dashboard ringkas portofolio.
- Tabel signal dan trade history.
- Visualisasi equity curve dan win/loss.

### Should Have

- Parsing semi otomatis dari raw text signal seperti contoh.
- Import signal dari file export chat.
- Tag strategi dan market condition.
- Audit trail untuk koreksi data.
- Export CSV.
- Filter dashboard.

### Could Have

- Integrasi webhook dari bot.
- Integrasi data harga real-time/delayed.
- Alert saat mendekati TP/SL.
- Comparison antara skipped signal dan executed trade.
- Per-strategy performance report.

### Won't Have di MVP

- Broker execution.
- Auto sell/buy.
- Multi-account.
- Machine learning optimizer.

## 11. UX Requirements

### Main Navigation

- Dashboard
- Signals
- Active Positions
- Trade History
- Analytics
- Settings

### Dashboard

Harus langsung menunjukkan:

- Total equity
- Cash available
- Realized P/L
- Unrealized P/L
- Win rate
- Active positions
- Today signals
- Risk exposure

### Signals Page

Harus menampilkan:

- Raw signal
- Parsed fields
- Plan status
- Action to enter, skip, or expire

### Active Positions Page

Harus menampilkan:

- Ticker
- Entry price
- Current price
- Highest after entry
- TP1/TP2/SL
- Unrealized P/L
- MFE/MAE
- Suggested status label: near TP, near SL, above TP1, above TP2

### Trade History Page

Harus menampilkan:

- Entry/exit detail
- Realized P/L
- Return percentage
- Holding period
- Exit reason
- Link to original signal

### Analytics Page

Harus menampilkan performa berdasarkan:

- Time
- Ticker
- Score bucket
- Strategy tag
- Market condition
- Exit reason

## 12. Non-Functional Requirements

- Data tidak boleh hilang saat refresh.
- Perhitungan keuangan harus deterministic dan testable.
- Semua nominal uang menggunakan integer rupiah untuk menghindari error floating point.
- Semua waktu disimpan dalam UTC, ditampilkan dalam WIB.
- Import/parsing signal harus menyimpan raw message agar bisa diaudit.
- Sistem harus dapat berjalan lokal untuk MVP.
- Arsitektur harus siap dikembangkan ke database server dan webhook.

## 13. Acceptance Criteria

- Pengguna dapat membuat signal dari raw text contoh `KOKA` dan `EPAC`.
- Sistem berhasil mengurai ticker, harga, score, TP1, TP2, SL, volume multiplier, dan
  market condition dari raw text.
- Dengan modal Rp20.000.000 dan allocation Rp1.000.000, sistem menghitung quantity
  rencana entry.
- Pengguna dapat mencatat entry dan exit aktual.
- Sistem menghitung realized P/L dan return percentage secara benar.
- Sistem menyimpan highest price after entry dan menghitung MFE.
- Dashboard menampilkan win rate berdasarkan closed trades.
- Open trade tidak dihitung sebagai win/loss sampai trade ditutup.
- Skipped signal tetap tercatat dan tidak mengubah saldo.
- Trade yang diedit memiliki audit trail.

## 14. Risiko dan Trade-Off

### Risiko Data Harga

Jika harga real-time tidak tersedia atau tidak reliable, MFE/MAE bisa salah.

Mitigasi:

- Mulai dari input manual atau import snapshot.
- Simpan sumber data dan timestamp.
- Pisahkan signal price, entry price, dan market price.

### Risiko Parsing Signal

Format pesan bot bisa berubah.

Mitigasi:

- Simpan raw message.
- Buat parser yang tolerant.
- Tampilkan field hasil parsing untuk dikoreksi manual.

### Risiko Kesimpulan Performa

Sample trade kecil dapat memberi kesimpulan palsu.

Mitigasi:

- Tampilkan jumlah sample.
- Jangan tampilkan rekomendasi agresif sampai sample cukup.
- Segmentasikan by strategy dan market condition.

### Risiko Over-Optimization

Dashboard terlalu kompleks dapat membuat pengguna mengejar metrik yang tidak actionable.

Mitigasi:

- MVP fokus pada journal, accounting, P/L, MFE/MAE, dan win rate.
- Insight lanjutan dibuat setelah data historis cukup.

## 15. Validation Plan

### Data Validation

- Uji parser dengan minimal 10 variasi signal asli.
- Uji kalkulasi quantity, P/L, return, MFE, MAE, dan win rate.
- Bandingkan perhitungan dengan spreadsheet manual.

### Product Validation

- Masukkan 20 signal historis.
- Tandai beberapa sebagai executed, skipped, dan expired.
- Tutup minimal 5 trade.
- Validasi apakah dashboard menjawab:
  - Bot profit atau loss?
  - Win rate berapa?
  - Signal score tinggi lebih baik atau tidak?
  - TP sering tercapai atau tidak?
  - Apakah user menjual terlalu cepat dibanding highest price after entry?

### Operational Validation

- Refresh browser dan pastikan data tetap ada.
- Export data dan cek kelengkapan field.
- Edit trade dan pastikan audit trail tercatat.

## 16. Implementation Plan Awal

### Phase 1: Local MVP

- Setup web app.
- Buat local persistence.
- Buat form signal dan parser raw message.
- Buat trade plan dan execution flow.
- Buat dashboard dasar.
- Buat kalkulasi performa.

### Phase 2: Analytics

- Tambah chart equity curve.
- Tambah segmentation by ticker, score, strategy, dan market condition.
- Tambah export CSV.
- Tambah audit trail.

### Phase 3: Automation

- Tambah webhook/import dari bot.
- Tambah price feed.
- Tambah alert TP/SL.
- Tambah portfolio snapshot scheduler.

## 17. Open Questions

- Sumber signal bot saat ini apa: Telegram, WhatsApp, API, database, atau file?
- Apakah harga saham akan diinput manual dulu atau perlu integrasi data market sejak
  MVP?
- Apakah fee broker yang dipakai tetap? Jika ya, berapa buy fee dan sell fee?
- Apakah satu signal selalu dibeli di harga signal, atau perlu mencatat slippage dari
  harga signal ke harga entry aktual?
- Apakah partial sell perlu didukung sejak awal?
- Apakah TP1 dan TP2 berarti jual sebagian atau hanya level evaluasi?
- Apakah dashboard ini untuk pribadi atau nantinya multi-user?

## 18. Rekomendasi MVP

Mulai dengan local-first portfolio tracker yang kuat di pencatatan dan kalkulasi.
Jangan langsung membangun auto-trading atau integrasi broker. Evidence yang paling
berharga pada tahap ini adalah data historis yang bersih: signal, keputusan entry,
harga aktual, exit, MFE/MAE, dan outcome.

Versi awal sebaiknya memprioritaskan:

- Data capture yang rapi.
- Parser raw signal yang bisa dikoreksi.
- Accounting modal Rp20.000.000 dan sizing Rp1.000.000.
- Dashboard performa yang membedakan signal quality, execution quality, dan market
  outcome.

