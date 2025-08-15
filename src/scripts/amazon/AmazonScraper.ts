import { promises as fs } from "fs";
import pLimit from "p-limit";
import { type Browser, type Locator, type Page } from "playwright";
import z from "zod";
import { getFilePath, retry } from "../../utils";
import { ScrapedItemSchema, type ScrapedItem } from "../types";
import { CONFIG } from "./config";
import { URL } from "./constants";

export default class AmazonScraper {
  private scrapedItems: Record<string, ScrapedItem[]> = {};
  private readonly limit = pLimit(3);

  getScrapedItems(): Record<string, ScrapedItem[]> {
    return this.scrapedItems;
  }

  constructor(
    private terms: string[],
    private browser: Browser,
  ) {}

  async scrapeItems(): Promise<void> {
    if (!this.browser) throw new Error("Browser not initialized");

    const context = await this.browser.newContext();

    try {
      const promises = this.terms.map((term) =>
        this.limit(async () => {
          const page = await context.newPage();
          try {
            const results = await this.scrapeTerm(page, term);
            this.scrapedItems[term] = results;
            console.log(`Finished scraping term: ${term}`);
          } catch (error) {
            console.error(`Error scraping term "${term}":`, error);
          } finally {
            await page.close();
          }
        }),
      );
      await Promise.allSettled(promises);
    } finally {
      await context.close();
    }
  }

  async saveData(): Promise<void> {
    for (const term of this.terms) {
      const items = this.scrapedItems[term];
      if (items && items.length > 0) {
        const filePath = await getFilePath("scraped", `${term}.json`);
        await fs.writeFile(filePath, JSON.stringify(items, null, 2), "utf-8");
      }
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async waitForSearchBox(page: Page): Promise<Locator> {
    let element = page.getByRole("searchbox", { name: "Search Amazon" });

    await retry(
      async () => {
        await element.waitFor({ timeout: CONFIG.timeouts.element });
      },
      {
        maxRetries: CONFIG.retryAttempts,
      },
      async () => {
        element = await this.handleAlternativeSearchBox(page);
      },
    );

    return element;
  }

  private async scrapeTerm(page: Page, term: string): Promise<ScrapedItem[]> {
    await page.goto(URL);

    await this.handleContinueShoppingButton(page);

    const searchbox = await this.waitForSearchBox(page);

    await this.handleDismissButton(page);

    // Simulate a search action
    await searchbox.fill(term);
    await searchbox.press("Enter");

    return await this.extractItems(page);
  }

  private async handleContinueShoppingButton(page: Page): Promise<void> {
    const continueButton = page.getByRole("button", {
      name: "Continue shopping",
    });
    if (
      await continueButton.isVisible({ timeout: CONFIG.timeouts.popupElements })
    ) {
      console.log("Continue shopping button found, clicking it");
      await continueButton.click();
    }
  }

  private async handleAlternativeSearchBox(page: Page): Promise<Locator> {
    const selectors = ["#nav-bb-search", "#twotabsearchtextbox"];

    for (const selector of selectors) {
      const locator = page.locator(selector);
      if (await locator.isVisible()) {
        console.log(`Alternative search box found: ${selector}`);
        return locator;
      }
    }

    throw new Error("No search box found");
  }

  private async handleDismissButton(page: Page): Promise<void> {
    const dismissButton = page.locator('[data-action-type="DISMISS"]');
    if (
      await dismissButton.isVisible({ timeout: CONFIG.timeouts.popupElements })
    ) {
      console.log("Dismiss button found, clicking it");
      await dismissButton.click();
    }
  }

  private async extractItems(page: Page): Promise<ScrapedItem[]> {
    console.log("Waiting for search results...");
    await retry(
      async () => {
        await page.waitForLoadState("domcontentloaded", {
          timeout: CONFIG.timeouts.loadState,
        });
      },
      { maxRetries: CONFIG.retryAttempts },
      async () => {
        console.log("Search results not loaded yet, retrying...");
      },
    );

    console.log("Search results loaded");

    const allItems = await page.locator(
      '[role="listitem"][data-component-type="s-search-result"]',
    );

    let items = await allItems.all();
    items = items.slice(0, CONFIG.maxItems);

    if (items.length === 0) {
      throw new Error("No search results found");
    }

    const results = await Promise.all(
      items.map((item) => this.extractItemData(item)),
    );
    const validResults = results.filter((item) => item !== null);

    if (validResults.length === results.length) {
      console.log(`All ${validResults.length} items successfully scraped.`);
    } else {
      console.warn(
        `Some items could not be scraped: ${results.length - validResults.length} failed.`,
      );
    }

    return validResults;
  }

  private async extractItemData(item: Locator): Promise<ScrapedItem | null> {
    const title = await item.locator("h2 span").first().textContent();

    const priceLocator = await this.getPrice(item);
    const price = await priceLocator.textContent();

    try {
      const validated = ScrapedItemSchema.safeParse({
        title: title,
        price: price,
      });
      return validated.data as ScrapedItem;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.message);
      } else {
        console.error("Unexpected error:", error);
      }
      return null;
    }
  }

  private async getPrice(item: Locator): Promise<Locator> {
    let price = await item.locator(".a-offscreen").first();

    if (!(await price.isVisible())) {
      console.warn("Price not found, trying alternative locator");
      price = item.locator(".a-color-base").first();
    }

    return price;
  }
}
