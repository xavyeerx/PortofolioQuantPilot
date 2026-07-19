# EDR: Local MVP Portfolio Tracker

## Context

Dokumen PRD sudah mendefinisikan kebutuhan utama: website portofolio untuk tracking
signal bot trading realtime, modal awal Rp20.000.000, alokasi default Rp1.000.000 per
call, tracking entry/exit, MFE/MAE, highest price after entry, P/L, dan win rate.

Repo saat ini belum memiliki aplikasi, dependency, atau struktur teknis. Karena itu
iterasi pertama dibuat sebagai static local-first web app.

## Decision

Bangun MVP awal sebagai static website dengan:

- `index.html`
- `styles.css`
- `app.js`
- Browser `localStorage` sebagai persistence sementara.
- Tanpa framework dan tanpa package eksternal.

## Rationale

- Cepat divalidasi tanpa setup rumit.
- Cocok untuk membuktikan workflow data capture dan kalkulasi.
- Mengurangi risiko dependency sebelum problem dan data flow matang.
- Mudah dimigrasikan ke React/Next.js atau backend database setelah workflow tervalidasi.

## Scope

MVP teknis pertama mencakup:

- Dashboard portofolio.
- Parser raw signal dari format contoh.
- Form tambah signal.
- Form entry/exit trade.
- Update harga berjalan untuk posisi aktif.
- Kalkulasi quantity dari alokasi Rp1.000.000.
- Tracking highest/lowest price after entry.
- Kalkulasi realized/unrealized P/L, win rate, average win/loss, MFE/MAE.
- Visualisasi sederhana dengan SVG/CSS.
- Persist data di browser.

## Data Persistence

Key `localStorage`:

- `quantpilot.portfolio.v1`

Data utama:

- `settings`
- `signals`
- `trades`
- `auditEvents`

## Trade Status

- `planned`
- `entered`
- `skipped`
- `closed`

## Validation

Validasi awal dilakukan dengan:

- Seed signal KOKA dan EPAC dari contoh.
- Cek parser mengenali ticker, price, score, TP1, TP2, SL, volume, market condition.
- Cek modal Rp20.000.000 dan allocation Rp1.000.000 menghasilkan planned quantity.
- Cek open trade tidak dihitung sebagai win/loss.
- Cek closed trade menghitung realized P/L dan win rate.

