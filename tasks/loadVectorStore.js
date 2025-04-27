import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import {
  OPENAI_API_KEY,
  QDRANT_URL,
  QDRANT_COLLECTION_NAME,
} from "../config/constants";

let vectorStoreInstance = null;

export async function getVectorStore() {
  if (vectorStoreInstance) return vectorStoreInstance;

  const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY });
  //   initialize vector store
  const vectorStore = new QdrantVectorStore(embeddings, {
    url: QDRANT_URL,
    collectionName: QDRANT_COLLECTION_NAME,
  });
  // Ensure the collection exists; create it if it doesn't
  await vectorStore.ensureCollection();
  vectorStoreInstance = vectorStore;
  return vectorStoreInstance;
}
