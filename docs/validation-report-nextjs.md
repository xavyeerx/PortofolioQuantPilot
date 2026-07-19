# Validation Report: Next.js Portfolio Tracker

## Validation Date

19 July 2026

## Result

Implementation status: PASS with one visual-testing limitation.

## Automated Checks

- `npm run lint`: PASS.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS.
- Next.js production route `/`: statically prerendered.
- Local production server: HTTP 200.
- Rendered response contains QuantPilot metadata/title.
- Existing localStorage key remains `quantpilot.portfolio.v1`.

## Functional Coverage

Implemented:

- Manual Telegram call capture.
- Automatic quantity planning from allocation.
- Planned, entered, closed, and skipped states.
- Actual buy/sell price and fee capture.
- Current, highest, and lowest price tracking.
- Realized and unrealized P/L.
- MFE, MAE, win rate, expectancy, and profit factor.
- Interactive equity curve.
- Capital allocation visualization.
- Dashboard, Calls, Positions, History, and Analytics views.
- Demo dataset for first-use validation.
- Responsive desktop and mobile layouts.

## Limitation

End-to-end screenshot automation was not executed because Python Playwright and a
Chromium browser binary are unavailable in the environment. Production compilation,
static generation, lint, TypeScript, and HTTP serving were all validated successfully.
Manual browser QA remains recommended before production deployment.

## Known Product Limitations

- Persistence is still browser-local and single-device.
- Price tracking is manual.
- No partial exit support.
- No live IDX price provider.
- No authentication, database backup, or multi-user support.

## Next Validation

Use at least 20 historical Telegram calls and compare quantity, fee, P/L, MFE, and MAE
against a manual spreadsheet. Test desktop and mobile workflows after Playwright browser
binaries are available.


## Flexible Capital and Lot Sizing Validation

- Starting capital can be edited from Portfolio Settings.
- Default budget per call can be edited.
- Lot size can be configured; default IDX regular-market value is 100 shares.
- New planned quantity is always a multiple of the configured lot size.
- Estimated buy value never exceeds the selected budget.
- Signal table shows budget, estimated buy value, remaining budget, lots, and shares.
- Existing local data without `lotSize` is migrated with the default value.
- Lint, TypeScript, and production build: PASS.


## Stockbit Fee Validation

Rates verified against Stockbit Help on 19 July 2026:

- Buy fee: 0.15%.
- Sell fee: 0.25%.

Validated accounting behavior:

- Fee inputs are absent from the trade form.
- New entries persist automatically calculated buy and sell fees.
- Net realized P/L includes both transaction fees.
- Net unrealized P/L includes buy fee and estimated sell fee at current price.
- Cash, invested capital, total equity, win rate, expectancy, and equity curve use net
  values.
- Lot planning includes buy fee and stays within the selected maximum budget.
- TypeScript and lint: PASS.
