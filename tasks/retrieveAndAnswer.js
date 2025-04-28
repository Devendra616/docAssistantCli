// Retrieval from vector db using LLM and Q&A
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { OPENAI_API_KEY } from "../config/constants.js";
import { getVectorStore } from "./loadVectorStore.js";
import { formatDocumentsAsString } from "langchain/util/document";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Retrieve and generate using the relevant snippets of the blog.
export async function setupRetrievalQA() {
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever();
  const llm = new ChatOpenAI({
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0,
    model: "gpt-4.1-nano",
  });

  // const prompt = (await pull) < ChatPromptTemplate > "rlm/rag-prompt";

  const prompt = ChatPromptTemplate.fromTemplate(
    `You are a helpful assistant. Use only the provided excerpts to answer the question.
Each excerpt has a source URL in metadata. Quote the relevant text and cite the source URL.
If the answer cannot be found, respond with "I don't know based on the provided documents."

Context:{context}
Question:{question}
Answer (with citations):`
  );

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(async (docs) => {
        const formattedDocs = Array.isArray(docs) ? docs : [docs];
        return formatDocumentsAsString(formattedDocs);
      }),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return chain;
}

// Define prompt for question-answering
export async function askQuestion(question) {
  try {
    const chain = await setupRetrievalQA();
    const result = await chain.invoke(question);
    return result;
  } catch (error) {
    console.error("Error in askQuestion:", error);
    throw error;
  }
}

export async function retrieveData(userQuestion) {
  try {
    // Query the collection
    const client = await getVectorStore();
    const results = await client.similaritySearch(userQuestion);

    // Process the results
    return await getLlmResponse(results, userQuestion);
  } catch (error) {
    console.error("Error retrieving data:", error);
  }
}

function extractSources(documents) {
  const sources = documents.map((doc) => doc.metadata.source);
  return [...new Set(sources)];
}
async function getLlmResponse(context, query) {
  const sourceUrls = extractSources(context);
  const systemPrompt = `
You are a helpful assistant. Use only the provided excerpts to answer the question.
Each excerpt has a source URL in metadata. Quote the relevant text and cite the source URL from the relevant Document's **metadata**.
If the answer cannot be found, respond with "I don't know based on the provided documents."
Note: Don't change or manipulate source, use from the metadata field only.

Context:{context}
Question:{question}
Source: {Source}
Answer (with sourceUrls ',' separated):
`;

  // Format the context properly
  const formattedContext = Array.isArray(context)
    ? context.map((doc) => doc.pageContent).join("\n")
    : context;

  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: `Context: ${formattedContext}\n\nQuestion: ${query}\n\n Answer:${context} \n\n Source: ${sourceUrls}`,
    },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Changed from gpt-4.1-nano to gpt-4
      messages: messages,
      temperature: 0,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error getting LLM response:", error);
    throw error;
  }
}
