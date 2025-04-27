// loading, splitting, embedding and storing of documents
import { promises as fs } from "fs";
import { SCRAPE_DATA_DIR } from "../config/constants";
import path from "path";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getVectorStore } from "./loadVectorStore.js";

// returns array of files contents as documents
export async function loadDocuments() {
  try {
    const files = await fs.readdir(SCRAPE_DATA_DIR);
    const documents = [];
    for (const file of files) {
      const filePath = path.join(SCRAPE_DATA_DIR, file);
      const content = await fs.readFile(filePath, "utf-8");
      documents.push({
        pageContent: content,
        metaData: {
          source: filePath,
        },
      });
    }
    return documents;
  } catch (err) {
    console.error(err);
  }
}

// split each document into chucks
export async function splitDocuments(documents) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });
  const splitDocs = [];
  for (const doc of documents) {
    const chunks = await splitter.splitDocuments([
      { pageContent: doc.pageContent, metadata: doc.metadata },
    ]);
    splitDocs.push(...chunks);
  }
  return splitDocs;
}

export async function embedAndStore(documents) {
  const vectorStore = await getVectorStore();
  return await vectorStore.addDocuments(documents);
}
