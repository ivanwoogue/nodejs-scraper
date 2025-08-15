/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "@tests/fixtures/AmazonScraper.fixture";
import { expect } from "playwright/test";

// tests/amazon-scraper.test.ts
test.describe("AmazonScraper", () => {
  test("should scrape items successfully", async ({
    amazonScraper,
    mockPage,
  }) => {
    // Override scraper's page creation to use your mock
    (amazonScraper as any).scrapeTerm = async () => {
      await mockPage.goto("https://amazon.com");

      return await (amazonScraper as any).extractItems(mockPage);
    };

    await amazonScraper.scrapeItems();

    const scrapedData = amazonScraper.getScrapedItems();
    expect(scrapedData["phone"]?.length).toBe(2);
  });

  test("should handle errors gracefully", async ({ amazonScraper, page }) => {
    await page.setContent("<html><body></body></html>");

    // Mock scrapeTerm to use this problematic page
    (amazonScraper as any).scrapeTerm = async () => {
      throw new Error("Scraping failed");
    };

    await amazonScraper.scrapeItems();

    // Should not throw, should handle error gracefully
    const scrapedData = (amazonScraper as any).scrapedItems;
    expect(scrapedData).toBeDefined();
  });
});
