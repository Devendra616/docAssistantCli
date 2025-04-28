// scrapes all internal links under base URL

import axios from "axios";
import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import path from "path";
import { URL } from "url";

// Main function to scrape a website

export async function scrape(baseUrl, outputDir) {
  // To track visited URLs and prevent cycles
  const visited = new Set();

  // Recursively crawl a given URL
  async function crawlPage(url) {
    if (visited.has(url)) return;

    visited.add(url);
    const fileName = urlToFilename(url);
    const filePath = path.join(outputDir, fileName);

    try {
      console.log(`Fetching 🌐...: ${url}`);
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      // extract main content from page
      const pageText = extractMainContent($);
      const record = {
        source: url,
        content: pageText,
      };
      // write JSON to file
      await fs.writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");

      const links = extractInternalLinks($, url, baseUrl);
      for (const link of links) {
        await crawlPage(link);
      }
    } catch (error) {
      // handle not found error
      let contentText;
      if (error.response && error.response.staus === 404) {
        contentText = "Content not available";
        console.warn(`⚠️  Page not found (404): ${url}`);
      } else {
        contentText = "Error fetching content";
        console.error(`❌ Failed to crawl ${url}:`, error.message);
      }
      const record = {
        source: url,
        content: contentText,
      };
      // write error record
      await fs.writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");
    }
  }

  await fs.mkdir(outputDir, { recursive: true });
  await crawlPage(baseUrl);
}

function extractMainContent($) {
  const mainPane = $(".main-pane");
  if (mainPane.length === 0) {
    return "Content not available";
  }
  mainPane.find("#summary").remove();
  mainPane.find("footer").remove();
  return mainPane.text().replace(/\s+/g, " ").trim();
}

/* Extract all internal links on the page that 
belong to the base domain */
function extractInternalLinks($, currentUrl, baseUrl) {
  const links = new Set();
  const base = new URL(currentUrl).origin; // Extract base URL (protocol + domain)

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    let linkUrl;
    if (href.startsWith("/")) {
      linkUrl = base + href; // Relative link
    } else if (href.startsWith(base)) {
      linkUrl = href; // Absolute internal link
    } else {
      return; // Skip external links
    }

    if (linkUrl.startsWith(baseUrl)) {
      links.add(linkUrl.split("#")[0]); // Remove anchor tags from URL
    }
  });

  return Array.from(links); // Return list of unique links
}

// Convert a URL into a safe filename
function urlToFilename(url) {
  const urlObj = new URL(url);
  const safePath =
    urlObj.pathname.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "index";
  return `${safePath}.json`; // Save as JSON file
}

/* async function main() {
  await scrape("https://docs.chaicode.com", "./scraped_docs");
}

main().catch(console.error);
 */
