import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import {
  OPENAI_API_KEY,
  QDRANT_URL,
  QDRANT_COLLECTION_NAME,
} from "../config/constants.js";

let vectorStoreInstance = null;

export async function getVectorStore() {
  if (vectorStoreInstance) return vectorStoreInstance;

  try {
    console.log("Initializing vector store with URL:", QDRANT_URL);
    const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY });

    const vectorStore = new QdrantVectorStore(embeddings, {
      url: QDRANT_URL,
      collectionName: QDRANT_COLLECTION_NAME,
    });

    console.log("Ensuring collection exists...");
    await vectorStore.ensureCollection();
    vectorStoreInstance = vectorStore;
    console.log("Vector store initialized successfully");
    return vectorStoreInstance;
  } catch (error) {
    console.error("Failed to initialize vector store:", error);
    console.error("Qdrant URL:", QDRANT_URL);
    console.error("Collection name:", QDRANT_COLLECTION_NAME);
    throw new Error(
      `Vector store initialization failed: ${error.message}. Please check if Qdrant server is running at ${QDRANT_URL}`
    );
  }
}
