import AmazonScraper from "@scripts/amazon";
import "dotenv/config";
import { chromium } from "playwright";

const terms = [
  "laptop",
  "phone",
  "tablet",
  "headphones",
  "watch",
  "television",
  "camera",
  "speaker",
  "printer",
  "monitor",
  "keyboard",
];

async function main() {
  const DEBUG = process.env.DEBUG === "true";
  console.log("Debug mode: ", process.env.DEBUG);

  const browser = await chromium.launch({
    headless: DEBUG ? false : true,
    devtools: DEBUG,
  });
  const scraper = new AmazonScraper(terms, browser);

  try {
    await scraper.scrapeItems();
    await scraper.saveData();
  } catch (error) {
    console.error("Error during scraping:", error);
  } finally {
    await scraper.cleanup();
    await browser.close();
  }
}

main();
