import { createAssistant } from './assistant.js';
import { fetchDocs } from './fetch.js';
import { fetchQuestions } from './fetchStackExchange.js';

const runSetup = async () => {
	console.log(
		'Hello! ✨. This script will download the doc files and generate the embeddings for them!'
	);

	const docsFile = await fetchDocs();

	const stackExchangeFile = await fetchQuestions();

	await createAssistant([docsFile, stackExchangeFile]);
};

runSetup().then(() => console.log('Done 💫'));
