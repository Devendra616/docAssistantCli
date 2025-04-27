// Handles scraping of website
import { scrape } from "../utils/webCrawler";
import { SCRAPE_URL, SCRAPE_DATA_DIR } from "../config/constants";

export async function scrapeDocumentation() {
  await scrape(SCRAPE_URL, SCRAPE_DATA_DIR);
}
