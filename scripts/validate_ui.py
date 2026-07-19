from playwright.sync_api import sync_playwright, expect


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.goto("http://localhost:4173")
        page.wait_for_load_state("networkidle")

        expect(page.locator("h1")).to_contain_text("Bot performance")
        expect(page.locator("#dashboard")).to_contain_text("Total Equity")

        page.locator("#tickerInput").fill("KOKA")
        page.locator("#entryPriceInput").fill("196")
        page.locator("#tp1Input").fill("219")
        page.locator("#tp2Input").fill("226")
        page.locator("#stopLossInput").fill("186")
        page.get_by_role("button", name="Save Call").click()
        expect(page.locator("#signalsTable")).to_contain_text("KOKA")

        page.get_by_role("button", name="Load Sample").click()
        expect(page.locator("#signalsTable")).to_contain_text("EPAC")

        page.screenshot(path="tmp/quantpilot-dashboard.png", full_page=True)
        browser.close()


if __name__ == "__main__":
    main()
