// Handles scraping of website
import { scrape } from "../utils/webCrawler.js";
import { SCRAPE_URL, SCRAPE_DATA_DIR } from "../config/constants.js";

export async function scrapeDocumentation() {
  await scrape(SCRAPE_URL, SCRAPE_DATA_DIR);
}
