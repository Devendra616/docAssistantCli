// scrapes all internal links under base URL

import axios from "axios";
import * as cheerio from "cheerio";
import { promises as fs } from "fs";
import path from "path";
import { URL } from "url";

export async function scrape(baseUrl, outputDir) {
  const visited = new Set();

  async function crawlPage(url) {
    if (visited.has(url)) return;
    visited.add(url);

    try {
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      const pageText = extractMainContent($);
      const fileName = urlToFilename(url);
      console.log("🚀 ~ crawlPage ~ fileName:", fileName, outputDir);
      await fs.writeFile(path.join(outputDir, fileName), pageText, "utf-8");

      const links = extractInternalLinks($, url, baseUrl);
      console.log("🚀 ~ crawlPage ~ links:", links);
      for (const link of links) {
        await crawlPage(link);
      }
    } catch (error) {
      const fileName = urlToFilename(url);
      if (error.response && error.response.staus === 404) {
        console.log("NotFound:", url);
        await fs.writeFile(
          path.join(outputDir, fileName),
          "Content not available",
          "utf-8"
        );
      } else {
        console.error(`Failed to crawl ${url}:`, error.message);
      }
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

function extractInternalLinks($, currentUrl, baseUrl) {
  const links = new Set();
  const base = new URL(currentUrl).origin;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    let linkUrl;
    if (href.startsWith("/")) {
      linkUrl = base + href;
    } else if (href.startsWith(base)) {
      linkUrl = href;
    } else {
      return;
    }
    if (linkUrl.startsWith(baseUrl)) {
      links.add(linkUrl.split("#")[0]); // Remove anchor parts
    }
  });

  return Array.from(links);
}

function urlToFilename(url) {
  const urlObj = new URL(url);
  const safePath = urlObj.pathname.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return (safePath || "index") + ".txt";
}

/* async function main() {
  await scrape("https://docs.chaicode.com", "./scraped_docs");
}

main().catch(console.error);
 */
