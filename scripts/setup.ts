import { createAssistant } from './assistant.js';
import { fetchDocs } from './fetch.js';

const runSetup = async () => {
	console.log(
		'Hello! ✨. This script will download the doc files and generate the embeddings for them!'
	);

	const fileName = await fetchDocs();

	await createAssistant([fileName]);
};

runSetup().then(() => console.log('Done 💫'));
