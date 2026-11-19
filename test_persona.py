import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"[PAGEERROR] {err}"))

        roles = ["CMO", "PCP", "SPECIALIST", "NAVIGATOR", "PATIENT"]
        for r in roles:
            await page.goto("http://localhost:3000/command", wait_until="networkidle")
            await page.evaluate(f"localStorage.setItem('custodia-role', '{r}'); window.location.reload();")
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(1.5)
            fn = f"screenshot_persona_{r.lower()}.png"
            await page.screenshot(path=fn, full_page=False)
            print(f"Captured persona {r} -> {fn}")

        # Test Arabic RTL view
        await page.evaluate("localStorage.setItem('custodia-language', 'ar'); window.location.reload();")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(1.5)
        await page.screenshot(path="screenshot_arabic_rtl.png", full_page=False)
        print("Captured Arabic RTL view -> screenshot_arabic_rtl.png")

        # Reset language to English
        await page.evaluate("localStorage.setItem('custodia-language', 'en'); localStorage.setItem('custodia-role', 'CMO');")

        print(f"Total errors logged across all persona tests: {len(errors)}")
        for e in errors:
            print("  ERR:", e)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
