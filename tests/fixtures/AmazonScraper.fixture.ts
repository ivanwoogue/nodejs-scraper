import AmazonScraper from "@/scripts/amazon";
import { test as base, type Page } from "@playwright/test";

type TestFixtures = {
  amazonScraper: AmazonScraper;
  mockPage: Page;
};

export const test = base.extend<TestFixtures>({
  amazonScraper: async ({ browser }, use) => {
    const scraper = new AmazonScraper(["phone"], browser);

    await use(scraper);

    await scraper.cleanup();
  },

  mockPage: async ({ context }, use) => {
    const page = await context.newPage();

    // Mock Amazon HTML responses
    await page.route("https://amazon.com", async (route) => {
      const mockHtml = `
        <html>
          <body>
            <input type="text" role="searchbox" placeholder="Search Amazon" />
            <div role="listitem" data-component-type="s-search-result">
              <h2><span>Samsung Galaxy A16 5G</span></h2>
              <span class="a-offscreen">$174.99</span>
            </div>
            <div role="listitem" data-component-type="s-search-result">
              <h2><span>iPhone 15 Pro</span></h2>
              <span class="a-offscreen">$999.99</span>
            </div>
          </body>
        </html>
      `;

      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: mockHtml,
      });
    });

    await use(page);

    await page.close();
  },
});
