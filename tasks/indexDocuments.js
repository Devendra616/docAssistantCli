// loading, splitting, embedding and storing of documents
import { promises as fs } from "fs";
import { SCRAPE_DATA_DIR } from "../config/constants.js";
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
        metadata: {
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
export async function getSplitedDocs(documents) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });
  const splittedDocs = [];
  for (const doc of documents) {
    const docText = JSON.parse(doc.pageContent);
    // docText: {source:'',content:''}
    const chunks = await splitter.splitDocuments([
      {
        pageContent: docText.content,
        metadata: { source: docText.source, loc: doc.metadata.source },
      },
    ]);
    splittedDocs.push(...chunks);
  }
  return splittedDocs;
}

export async function embedAndStore(documents) {
  const vectorStore = await getVectorStore();
  return await vectorStore.addDocuments(documents);
}
