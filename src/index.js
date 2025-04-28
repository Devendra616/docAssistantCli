// Scrape docs → Save .txt → Split → Embed → Store → Retrieve+Answer.
// Entry point of application
import dotenv from "dotenv";
dotenv.config();

import { scrapeDocumentation } from "../tasks/scrape.js";
import {
  loadDocuments,
  getSplitedDocs,
  embedAndStore,
} from "../tasks/indexDocuments.js";
import {
  setupRetrievalQA,
  askQuestion,
  retrieveData,
} from "../tasks/retrieveAndAnswer.js";
import { getVectorStore } from "../tasks/loadVectorStore.js";
import { QDRANT_COLLECTION_NAME, OPENAI_API_KEY } from "../config/constants.js";

async function main() {
  // await scrapeDocumentation();
  // const rawDocs = await loadDocuments();
  // const splitDocs = await getSplitedDocs(rawDocs);
  // console.log("🚀 ~ main ~ splitDocs:", splitDocs);
  // await embedAndStore(splitDocs);

  // const qaChain = await setupRetrievalQA();

  const userQuestion = "How to create a new branch in Git?";
  // await askQuestion(qaChain, userQuestion);
  const result = await retrieveData(userQuestion);
  console.log(result);
}

main();
