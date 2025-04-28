// Scrape docs → Save .txt → Split → Embed → Store → Retrieve+Answer.
// Entry point of application
import dotenv from "dotenv";
dotenv.config();
import readline from "readline";
import chalk from "chalk";
import ora from "ora";
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

// Shortcuts mapping
const args = process.argv.slice(2).map((arg) => {
  if (arg === "-s") return "--scrape";
  if (arg === "-i") return "--index";
  if (arg === "-a") return "--ask";
  if (arg === "-I") return "--interactive";
  return arg;
});

async function main() {
  // const qaChain = await setupRetrievalQA();
  if (args.includes("--scrape")) {
    const spinner = ora("🐞 Scraping documentation...").start();
    try {
      await scrapeDocumentation();
      spinner.succeed("✅ Scraping completed.");
    } catch (error) {
      spinner.fail("❌ Scraping failed.");
      console.error(error);
    }
    return;
  }

  if (args.includes("--index")) {
    const spinner = ora("🔢 Indexing documents...").start();
    // console.log(chalk.blue(" Indexing documents..."));
    try {
      const rawDocs = await loadDocuments();
      const splitDocs = await splitDocuments(rawDocs);
      await embedAndStore(splitDocs);
      spinner.succeed("✅ Indexing completed.");
    } catch (error) {
      spinner.fail("❌ Indexing failed.");
      console.error(error);
    }
    return;
  }

  const askArgIndex = args.indexOf("--ask");
  if (askArgIndex !== -1 && args[askArgIndex + 1]) {
    const userQuestion = args.slice(askArgIndex + 1).join(" ");
    console.log(chalk.yellow(`🤔 Asking: "${userQuestion}"`));
    const result = await retrieveData(userQuestion);
    console.log(chalk.green(result));
    return;
  }

  if (args.includes("--interactive")) {
    console.log(
      chalk.magenta("🤖 Starting interactive Q&A mode. Type 'exit' to quit.")
    );
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt(chalk.cyan("📝 Your question: "));
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
      console.log(chalk.yellow(`\n🔎 Question: ${question}`));
      const result = await retrieveData(question);
      console.log(chalk.green(result));
      rl.prompt();
    });

    rl.on("close", () => {
      console.log(chalk.green("👋 Exiting. Goodbye!"));
      process.exit(0);
    });
    return;
  }

  console.log(
    chalk.gray(`******** WELCOME TO CHAI-DOCS ******** 
      
Usage:

  Usage:
  -s, --scrape             Scrape the documentation
  -i, --index              Index the scraped documents
  -a, --ask "question"     Ask a single question over the documents
  -I, --interactive        Start an interactive Q&A chat

Examples:
  npm start -- --scrape
  npm start -- -s
  npm start -- --index
  npm start -- -i
  npm start -- --ask "How to create a branch in git?"
  npm start -- -a "How to create a branch in git?"
  npm start -- --interactive
  npm start -- -I
  `)
  );
}

main();
