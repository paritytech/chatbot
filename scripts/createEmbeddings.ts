import { readFile, readdir } from 'fs/promises';
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import OpenAi from 'openai';
import path from 'path';
import url from 'url';
import { env } from './env';

import weaviate, { ObjectsBatcher } from 'weaviate-ts-client';

const client = weaviate.client({
	scheme: env.WEAVIATE_PROTOCOL,
	host: env.WEAVIATE_URL
});

type ChatItem = {
	Text: string;
	Source: string;
	Vector: number[];
};

type FileData = { filename: string; content: string[]; source?: string };
type FileAndContent = [string, string];

const docsSource = 'https://wiki.polkadot.network/docs/';

/** Parses the metadata from a markdown file and removes it from the original text
 * Returns an tuple [cleanedFile, metadataDictionary]
 */
const cleanMetadata = (markdown: string): [string, Record<string, string> | null] => {
	const charactersBetweenGroupedHyphens = /^---([\s\S]*?)---/;
	const metadataMatched = markdown.match(charactersBetweenGroupedHyphens);

	if (!metadataMatched || !metadataMatched[1]) {
		return [markdown, null];
	}

	const metadata = metadataMatched[1];
	const metadataLines = metadata.split('\n');
	const metadataObject = metadataLines.reduce((accumulator: Record<string, string>, line) => {
		const [key, ...value] = line.split(':').map((part) => part.trim());

		if (key) {
			accumulator[key] = value[1] ? value.join(':') : value.join('');
		}
		return accumulator;
	}, {});

	return [markdown.replace(/^(---[\s\S]*?---)/, '').trim(), metadataObject];
};

const fetchFiles = async (): Promise<FileAndContent[]> => {
	const files: FileAndContent[] = [];

	for await (const file of await readdir('data/docs')) {
		const content = await readFile(`data/docs/${file}`, 'utf8');
		files.push([file, content]);
	}

	if (files.length === 0) {
		throw new Error('No files were parsed. Are you sure they exist?');
	}

	console.log('Fetched %s files 🗂️', files.length);

	return files;
};

const handleMarkdownContent = async (files: FileAndContent[]): Promise<FileData[]> => {
	console.log('Parsing Markdown files 📄');
	const textSplitter = new MarkdownTextSplitter();

	const parsedFiles: FileData[] = [];

	for (let i = 0; i < files.length; i++) {
		const [fileName, content] = files[i];
		const [cleanedContent, metadata] = cleanMetadata(content);
		const parsedMarkdown = await textSplitter.createDocuments([cleanedContent]);
		const source = metadata?.slug.replace(/^(?:\.\.\/)+/, docsSource);
		parsedFiles[i] = {
			filename: fileName,
			content: parsedMarkdown.map((pm) => pm.pageContent),
			source
		};
	}

	return parsedFiles;
};

export type Embeddings = { embedding: number[]; created: number };

const generateEmbedding = async (files: FileData[]): Promise<{ [key: string]: Embeddings }> => {
	const openAIApiKey = env.OPENAI_API_KEY;
	if (!openAIApiKey) {
		throw new Error('Missing OPENAI_API_KEY');
	}

	const openai = new OpenAi({ apiKey: openAIApiKey });
	const embeddingStore: { [key: string]: Embeddings } = {}; // Contains embedded data for future use
	// Reads the raw text file
	console.log('Embedding Started ⌛');

	const dbLocation = path.join(
		path.parse(url.fileURLToPath(import.meta.url)).dir,
		'..',
		'src/lib/embeddings'
	);

	console.log('Connecting to index in', dbLocation);

	// Generate unix timestamp
	const startTime = new Date().getTime();

	let batcher: ObjectsBatcher = client.batch.objectsBatcher();
	let counter: number = 0;
	const batchSize: number = 100;

	for (let i = 0; i < files.length; i++) {
		const { filename, content, source } = files[i];

		try {
			console.log("Sent file '%s' over to OpenAI 🚀", filename);

			const response = await openai.embeddings.create({
				input: content,
				model: 'text-embedding-ada-002'
			});

			const countParas = content.length;

			// Check if data recieved correctly
			if (response.data.length >= countParas) {
				for (let i = 0; i < countParas; i++) {
					// Adding each embedded para to embeddingStore
					const key = content[i];
					embeddingStore[key] = {
						embedding: response.data[i].embedding,
						created: new Date().getTime()
					};

					const item = {
						class: 'Question',
						properties: {
							text: key,
							source: source ?? ''
						},
						vector: response.data[i].embedding
					};

					batcher.withObject(item);

					if (counter++ % batchSize === 0) {
						console.log('Uploading into DB');
						// Flush the batch queue and restart it
						await batcher.do();
						batcher = client.batch.objectsBatcher();
					}
				}
			} else {
				console.error('Send %s paragraphs but got %s back', countParas, response.data.length);
				throw new Error('Missmatch in amount of returned content');
			}

			console.log("Finished parsing '%s' 💫. %s remaining!", filename, files.length - (i + 1));
		} catch (error: any) {
			console.log('Some error happened');
			// Error handling code
			if (error.response) {
				console.error(error.response.status, error.response.data);
			} else {
				console.log(error);
			}

			throw error;
		}
	}
	await batcher.do();
	console.log(`Finished importing ${counter} objects.`);

	const completionTime = new Date().getTime();
	console.log('Embedding finished ✨');
	console.log(`Time taken : ${(completionTime - startTime) / 1000} seconds`);
	return embeddingStore;
};

export const generateEmbeddings = async (): Promise<{ [key: string]: Embeddings }> => {
	const files = await fetchFiles();
	const docs = await handleMarkdownContent(files);

	const embeddings = await generateEmbedding(docs);

	return embeddings;
};
