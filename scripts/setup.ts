import * as dotenv from 'dotenv';

import { generateEmbeddings } from './createEmbeddings';
import { fetchDocs } from './fetch';

dotenv.config();

const runSetup = async () => {
	console.log(
		'Hello! ✨. This script will download the doc files and generate the embeddings for them!'
	);

	await fetchDocs();

	await generateEmbeddings();
};

runSetup().then(() => console.log('Done 💫'));
