import { OpenAIApi, Configuration } from "openai";
import { MarkdownTextSplitter } from "langchain/text_splitter";
import { readFile, writeFile, readdir, mkdir } from "fs/promises";

type FileAndContent = [string, string];


let destPath = "./data/embeddings/polkadot-test.json";

const fetchFiles = async (): Promise<FileAndContent[]> => {
    const files: FileAndContent[] = [];

    for await (const file of await readdir("data/docs")) {
        const content = await readFile(`data/docs/${file}`, 'utf8');
        files.push([file, content]);
    }

    if (files.length === 0) {
        throw new Error("No files were parsed. Are you sure they exist?");
    }

    console.log("Fetched %s files 🗂️", files.length);

    return files;
}

const handleMarkdownContent = async (files: FileAndContent[]): Promise<[string, string[]][]> => {
    console.log("Parsing Markdown files 📄")
    const textSplitter = new MarkdownTextSplitter();

    const parsedFiles: [string, string[]][] = [];

    for (let i = 0; i < files.length; i++) {
        const [fileName, content] = files[i];
        const parsedMarkdown = await textSplitter.createDocuments([content]);
        parsedFiles[i] = [fileName, parsedMarkdown.map(pm => pm.pageContent)];
        const parsedDoc = JSON.stringify(parsedMarkdown, null, 2);
        // await writeFile(`./data/parsed/${fileName}.json`, parsedDoc);
    }

    return parsedFiles;
}




type Embeddings = { embedding: number[], created: number };

const generateEmbedding = async (files: [string, string[]][]): Promise<{ [key: string]: Embeddings }> => {
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
        throw new Error("Missing OPENAI_API_KEY");
    }

    const openai = new OpenAIApi(new Configuration({ apiKey: openAIApiKey }));
    const embeddingStore: { [key: string]: Embeddings } = {}; // Contains embedded data for future use
    // Reads the raw text file
    console.log("Embedding Started ⌛");

    // Generate unix timestamp
    const startTime = new Date().getTime();

    for (let i = 0; i < files.length; i++) {
        const [fileName, paras] = files[i];


        try {
            console.log("Sent file '%s' over to OpenAI 🚀", fileName);

            const response = await openai.createEmbedding({
                input: paras,
                model: "text-embedding-ada-002",
            });

            const countParas = paras.length;

            // Check if data recieved correctly
            if (response.data.data.length >= countParas) {
                for (let i = 0; i < countParas; i++) {
                    // Adding each embedded para to embeddingStore
                    const key = paras[i];
                    embeddingStore[key] = {
                        embedding: response.data.data[i].embedding,
                        created: new Date().getTime(),
                    };
                }
            } else {
                console.error("Send %s paragraphs but got %s back", countParas, response.data.data.length);
                throw new Error("Missmatch in amount of returned content");
            }

            console.log("Finished parsing '%s' 💫. %s remaining!", fileName, files.length - (i + 1));

        } catch (error: any) {
            console.log("Some error happened");
            // Error handling code
            if (error.response) {
                console.error(error.response.status, error.response.data);
            } else {
                console.log(error);
            }

            throw error;
        }
    }

    const completionTime = new Date().getTime();
    console.log("Embedding finished ✨");
    console.log(`Time taken : ${(completionTime - startTime) / 1000} seconds`);
    return embeddingStore;
};

export const generateEmbeddings = async () => {
    await mkdir("./data/embeddings", { recursive: true });
    const files = await fetchFiles();
    const docs = await handleMarkdownContent(files);

    const embeddings = await generateEmbedding(docs);
    // Write embeddingStore to destination file
    await writeFile(destPath, JSON.stringify(embeddings, null, 2));
}
