# Validation Report: Local MVP Portfolio Tracker

## Scope

Validasi dilakukan untuk iterasi pertama website static local-first.

## Checks Performed

### Static Syntax Check

Command:

```text
npm run check
```

Result:

- `app.js` syntax valid.
- `server.js` syntax valid.

### Local Server Check

Server dijalankan dengan:

```text
node server.js
```

HTTP check:

- `http://localhost:4173/` returns `200`
- `http://localhost:4173/app.js` returns `200`
- `http://localhost:4173/styles.css` returns `200`

### Browser Automation Attempt

Browser automation via Playwright Python tidak bisa dijalankan karena package Python
`playwright` belum tersedia.

Browser automation via Node menemukan package `playwright`, tetapi Chromium binary belum
terunduh di environment ini.

## Validation Status

Pass:

- File website tersedia.
- Server lokal berjalan.
- HTML, CSS, dan JS bisa disajikan via HTTP.
- Syntax JavaScript valid.
- MVP memiliki signal parser, portfolio metrics, active positions, trade history,
  analytics view, dan localStorage persistence.

Not Yet Verified:

- Screenshot visual otomatis.
- Full browser interaction automation.

## Next Validation Step

- Buka `http://localhost:4173/` di browser.
- Isi `Ticker`, `Entry Price`, `TP1`, `TP2`, dan `Stop Loss`.
- Klik `Save Call`.
- Pastikan tabel history menampilkan ticker yang dicatat.
- Klik `Load Sample`.
- Pastikan `EPAC` muncul.
- Klik `Enter/Edit`, isi buy/current/sell price, lalu pastikan P/L dan win rate berubah.

