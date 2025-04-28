// Scrape docs → Save .txt → Split → Embed → Store → Retrieve+Answer.
// Entry point of application
import dotenv from "dotenv";
dotenv.config();
import readline from "readline";
import chalk from "chalk";
import inquirer from "inquirer";
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

async function main() {
  console.log(
    chalk.blueBright(`🌟 Welcome to `) +
      chalk.hex("#ff8904").bold("ChaiCode - Docs ") +
      chalk.blueBright("Assistant! 🌟\n")
  );

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: chalk.cyan("What would you like to do?"),
        choices: [
          { name: "🕷️  Scrape Documentation", value: "scrape" },
          { name: "🔢  Index Documents", value: "index" },
          { name: "🤔  Ask a Question", value: "ask" },
          { name: "👋  Quit", value: "quit" },
        ],
      },
    ]);

    if (action === "scrape") {
      const spinner = ora("🐞 Scraping documentation...").start();
      try {
        await scrapeDocumentation();
        spinner.succeed("✅ Scraping completed.");
      } catch (error) {
        spinner.fail("❌ Scraping failed.");
        console.error(error);
      }
    } else if (action === "index") {
      const spinner = ora("🔢 Indexing documents...").start();
      // console.log(chalk.blue(" Indexing documents..."));
      try {
        const rawDocs = await loadDocuments();
        const splitDocs = await getSplitedDocs(rawDocs);
        await embedAndStore(splitDocs);
        spinner.succeed("✅ Indexing completed.");
      } catch (error) {
        spinner.fail("❌ Indexing failed.");
        console.error(error);
      }
    } else if (action === "ask") {
      const { userQuestion } = await inquirer.prompt([
        {
          type: "input",
          name: "userQuestion",
          message: chalk.cyan("📝 Enter your question:"),
        },
      ]);
      if (userQuestion.trim()) {
        console.log(chalk.yellow(`\n🔎 Question: ${userQuestion}`));
        const result = await retrieveData(userQuestion);
        console.log(chalk.greenBright(result));
      } else {
        console.log(chalk.red("❗ No question entered."));
      }
    } else if (action === "quit") {
      console.log(chalk.green("👋 Exiting. Goodbye!"));
      process.exit(0);
    }
  }
}

main();
