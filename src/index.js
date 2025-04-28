// Scrape docs → Save .txt → Split → Embed → Store → Retrieve+Answer.
// Entry point of application
import dotenv from "dotenv";
dotenv.config();
import readline from "readline";

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

const args = process.argv.slice(2);

async function main() {
  // const qaChain = await setupRetrievalQA();

  if (args.includes("--scrape")) {
    console.log("🐞 Scraping documentation...");
    await scrapeDocumentation();
    console.log("✅ Scraping completed.");
    return;
  }

  if (args.includes("--index")) {
    console.log("🔢 Indexing documents...");
    const rawDocs = await loadDocuments();
    const splitDocs = await getSplitedDocs(rawDocs);
    await embedAndStore(splitDocs);
    console.log("✅ Indexing completed.");
    return;
  }

  const askArgIndex = args.indexOf("--ask");
  if (askArgIndex !== -1 && args[askArgIndex + 1]) {
    const userQuestion = args.slice(askArgIndex + 1).join(" ");
    console.log(`🤔 Asking: "${userQuestion}"`);
    const result = await retrieveData(userQuestion);
    console.log(result);
    return;
  }

  if (args.includes("--interactive")) {
    console.log("🤖 Starting interactive Q&A mode. Type 'exit' to quit.");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt("📝 Your question: ");
    rl.prompt();

    rl.on("line", async (line) => {
      const question = line.trim();
      if (
        question.toLowerCase() === "exit" ||
        question.toLowerCase() === "quit"
      ) {
        rl.close();
        return;
      }
      await retrieveData(question);
      rl.prompt();
    });

    rl.on("close", () => {
      console.log("👋 Exiting. Goodbye!");
      process.exit(0);
    });
    return;
  }

  console.log(`
Usage:
  --scrape           Scrape the documentation
  --index            Index the scraped documents
  --ask "question"   Ask a single question over the documents
  --interactive      Start an interactive Q&A chat
  
Examples:
  npm start --scrape
  npm start --index
  npm start --ask "How to create a branch in git?"
  npm start --interactive
  `);
}

main();
