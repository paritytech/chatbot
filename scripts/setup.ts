import { createReadStream, writeFileSync } from "fs";
import OpenAi from 'openai';
import { env } from './env';
import { fetchDocs } from './fetch';

const uploadDocuments = async (documents:string[]) => {
	const openai = new OpenAi({ apiKey: env.OPENAI_API_KEY });
	const aiFiles: OpenAi.Files.FileObject[] = []
	for (let i = 0; i < documents.length; i++) {
		const filename = documents[i];
		console.log("Sent file '%s' over to OpenAI 🚀. %s remaining!", filename, documents.length - (i + 1));
		const file = await openai.files.create({
			file: createReadStream(filename),
			purpose: "assistants"
		});
		aiFiles.push(file);
	}
	return aiFiles;
}

const runSetup = async () => {
	console.log(
		'Hello! ✨. This script will download the doc files and generate the embeddings for them!'
	);

	const fileName = await fetchDocs();

	const files = await uploadDocuments([fileName]);

	writeFileSync("src/lib/server/docs.json", JSON.stringify(files, null, 2));
};

runSetup().then(() => console.log('Done 💫'));
