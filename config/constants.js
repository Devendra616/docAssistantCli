// config/constants.js
export const SCRAPE_URL = "https://docs.chaicode.com";
export const SCRAPE_DATA_DIR = "./scraped_docs/";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
export const QDRANT_COLLECTION_NAME = "chaiCodeDocs";
