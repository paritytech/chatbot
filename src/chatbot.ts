import "https://deno.land/std@0.186.0/dotenv/load.ts";
import {
  loadQARefineChain,
  RetrievalQAChain,
} from "https://esm.sh/langchain/chains";
import { OpenAIEmbeddings } from "https://esm.sh/langchain/embeddings/openai";
import { OpenAI } from "https://esm.sh/langchain/llms/openai";
import { MemoryVectorStore } from "https://esm.sh/langchain/vectorstores/memory";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
if (!openAIApiKey) {
  throw new Error("Missing OPENAI_API_KEY");
}
const modelData = JSON.parse(Deno.readTextFileSync("data/embeddings/chatbot-model.json"));
const openAIModel = new OpenAI({ ...modelData, openAIApiKey });

const embeddingsModel = new OpenAIEmbeddings({
  openAIApiKey, modelName: 'text-embedding-ada-002'
});

const vectorStoreData = JSON.parse(Deno.readTextFileSync("data/embeddings/chatbot-vectorstore.json"));
vectorStoreData.embeddings = embeddingsModel;

const vectorStore = new MemoryVectorStore(embeddingsModel);
vectorStore.memoryVectors = vectorStoreData.memoryVectors;


const combineDocumentsChain = loadQARefineChain(openAIModel, );

const chainInstance = new RetrievalQAChain({
  combineDocumentsChain,
  retriever: vectorStore.asRetriever(),
});

const query = await chainInstance.call({
  query: "What are the docs about?"
})

console.log(query);
