import { OpenAI } from "https://esm.sh/langchain/llms/openai";
import { OpenAIEmbeddings } from "https://esm.sh/langchain/embeddings/openai";
import { MemoryVectorStore } from "https://esm.sh/langchain/vectorstores/memory";
import { RetrievalQAChain, loadQARefineChain } from "https://esm.sh/langchain/chains";
import "https://deno.land/std@0.186.0/dotenv/load.ts";
import { MarkdownTextSplitter } from "https://esm.sh/langchain/text_splitter";
import { Document } from "https://esm.sh/v119/langchain@0.0.72/dist/document.js";


const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
if (!openAIApiKey) {
    throw new Error("Missing OPENAI_API_KEY");
}

const files: string[] = [];

for await (const file of Deno.readDir("data/docs")) {
    const content = await Deno.readTextFile(`data/docs/${file.name}`);
    files.push(content);

if (files.length === 0) {
  throw new Error("No files were parsed. Are you sure they exist?");
}

const textSplitter = new MarkdownTextSplitter();

// deno-lint-ignore no-explicit-any
const splittedDocs: Document<Record<string, any>>[] = [];

console.log("Parsing documents")
for (const content of files) {
    const splitDocs = await textSplitter.createDocuments([content]);
    splittedDocs.push(...splitDocs);
}

const model = new OpenAI({
    openAIApiKey,
    modelName: 'gpt-3.5-turbo'
});

console.log("Generating embeddings");
const embeddings = new OpenAIEmbeddings({ openAIApiKey });

console.log("Generating Vector Story")
const vectorStore = await MemoryVectorStore.fromDocuments(splittedDocs, embeddings);

const chain = new RetrievalQAChain({
    combineDocumentsChain: loadQARefineChain(model),
    retriever: vectorStore.asRetriever(),
});

console.log("Writing files");
await Deno.mkdir("data/embeddings", { recursive: true });
await Deno.writeTextFile("data/embeddings/chatbot-chain.json", JSON.stringify(chain));
await Deno.writeTextFile("data/embeddings/chatbot-vectorstore.json", JSON.stringify(vectorStore));
await Deno.writeTextFile("data/embeddings/chatbot-model.json", JSON.stringify(model));
