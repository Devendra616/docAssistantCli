import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OPENAI_API_KEY, QDRANT_URL } from "../config/constants";

export async function loadVectorStore() {
  const embeddings = new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY });
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: QDRANT_URL,
      collectionName: "chaiCodeDocs",
    }
  );
  return vectorStore;
}
