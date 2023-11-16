import { createReadStream, readFileSync } from 'fs';
import OpenAi from 'openai';
import { env } from './env.js';

const openai = new OpenAi({ apiKey: env.OPENAI_API_KEY });

/**
 * Uploads an array of documents to Open AI and returns their file IDs
 * @param {string[]} documents Array with location of docs
 * @returns {Promise<void>}
 */
const uploadDocuments = async (documents: string[]): Promise<OpenAi.Files.FileObject[]> => {
	if (documents.length >= 20) {
		throw new Error('Document limit is 20. Please do not upload more than 20 files');
	}

	/** @type {import("openai").OpenAI.Files.FileObject[]} */
	const aiFiles: OpenAi.Files.FileObject[] = [];
	for (let i = 0; i < documents.length; i++) {
		const filename = documents[i];
		console.log(
			"Sent file '%s' over to OpenAI 🚀. %s remaining!",
			filename,
			documents.length - (i + 1)
		);
		const file = await openai.files.create({
			file: createReadStream(filename),
			purpose: 'assistants'
		});
		aiFiles.push(file);
	}
	return aiFiles;
};

export const createAssistant = async (documents: string[]): Promise<string> => {
	const documentObjs = await uploadDocuments(documents);
	console.log('Getting instructions');
	const instructions = readFileSync('./data/chatbot-configuration.txt', 'utf-8');
	console.log('Creating assistant');
	const assistant = await openai.beta.assistants.create({
		name: 'Polkadot Chatbot',
		instructions,
		model: 'gpt-4-1106-preview',
		tools: [{ type: 'retrieval' }],
		file_ids: documentObjs.map((doc) => doc.id)
	});

	console.log(
		"Assistant '%s' has been created. Id is '%s'. " +
			"Save it under the environment variable named 'ASSISTANT_ID'",
		assistant.name,
		assistant.id
	);

	return assistant.id;
};
