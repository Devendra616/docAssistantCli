// Retrieval from vector db using LLM and Q&A
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { OPENAI_API_KEY } from "../config/constants.js";
import { loadVectorStore } from "./loadVectorStore.js";
import { formatDocumentsAsString } from "langchain/util/document";
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableMap,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Retrieve and generate using the relevant snippets of the blog.
export async function setupRetrievalQA() {
  const vectorStore = await loadVectorStore();
  const retriever = vectorStore.asRetriever();
  const llm = new ChatOpenAI({
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0,
    model: "gpt-4.1-nano",
  });

  const prompt = (await pull) < ChatPromptTemplate > "rlm/rag-prompt";

  /* const prompt = new PromptTemplate({
    template: `You are a helpful assistant. Use only the provided excerpts to answer the question.
Each excerpt has a source URL. Quote the relevant text and cite the source URL.
If the answer cannot be found, respond with "I don't know based on the provided documents."

Context:
{context}

Question:
{question}

Answer (with citations):`,
    inputVariables: ["context", "question"],
  }); */
  const ragChainFromDocs = RunnableSequence.from([
    RunnablePassthrough.assign({
      context: (input) => formatDocumentsAsString(input.context),
    }),
    prompt,
    llm,
    new StringOutputParser(),
  ]);
  return { retriever, ragChainFromDocs };
}

//  Define prompt for question-answering
export async function askQuestion(question) {
  const { retriever, ragChainFromDocs } = setupRetrievalQA();
  let ragChainWithSource = new RunnableMap({
    steps: { context: retriever, question: new RunnablePassthrough() },
  });
  ragChainWithSource = ragChainWithSource.assign({
    answer: ragChainFromDocs,
  });
  const result = await ragChainWithSource.invoke(question);
  console.log("\nResult Answer:", result);
  return result.answer;
}
