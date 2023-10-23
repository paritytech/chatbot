import { readFile, readdir, writeFile } from 'fs/promises';
import { MarkdownTextSplitter } from 'langchain/text_splitter';
import OpenAi from 'openai';
import path from 'path';
import url from 'url';
import { LocalIndex } from 'vectra';

type FileData = { filename: string; content: string[]; source?: string };
type FileAndContent = [string, string];

let destPath = './data/embeddings/polkadot-test.json';
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
	const openAIApiKey = process.env.OPENAI_API_KEY;
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

	const index = new LocalIndex(dbLocation);

	if (!(await index.isIndexCreated())) {
		console.log('Index is not created. Creating new one');
		await index.createIndex();
	}

	// Generate unix timestamp
	const startTime = new Date().getTime();

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
					await index.insertItem({
						vector: response.data[i].embedding,
						metadata: { text: key, source }
					});
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

	const completionTime = new Date().getTime();
	console.log('Embedding finished ✨');
	console.log(`Time taken : ${(completionTime - startTime) / 1000} seconds`);
	return embeddingStore;
};

export const generateEmbeddings = async (): Promise<{ [key: string]: Embeddings }> => {
	const files = await fetchFiles();
	const docs = await handleMarkdownContent(files);

	const embeddings = await generateEmbedding(docs);
	// Write embeddingStore to destination file
	await writeFile(destPath, JSON.stringify(embeddings, null, 2));

	return embeddings;
};
