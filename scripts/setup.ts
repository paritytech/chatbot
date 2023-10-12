import * as dotenv from 'dotenv';
import url from 'url';

import { fetchDocs } from './fetch';
import { Embeddings, generateEmbeddings } from './createEmbeddings';
import { createClient } from 'redis';
import { LocalIndex } from 'vectra';
import Openai from 'openai';
import path from 'path';

dotenv.config();

const storeEmbeddings = async (embeddings: { [key: string]: Embeddings }) => {
	const dbLocation = path.join(
		path.parse(url.fileURLToPath(import.meta.url)).dir,
		'..',
		'data/embedings'
	);

	console.log('Connecting to index in', dbLocation);

	const index = new LocalIndex(dbLocation);

	if (!(await index.isIndexCreated())) {
		console.log('Index is not created. Creating new one');
		await index.createIndex();
	}

	const keys = Object.keys(embeddings);
	for (let i = 0; i < keys.length; i++) {
		console.log(`Saving to disk 💾 embedding ${i}/${keys.length}`);
		const key = keys[i];
		await index.insertItem({
			vector: embeddings[key].embedding,
			metadata: { text: key }
		});
	}
};

const runSetup = async () => {
	console.log(
		'Hello! ✨. This script will download the doc files and generate the embeddings for them!'
	);

	await fetchDocs();

	const embeddings = await generateEmbeddings();

	storeEmbeddings(embeddings);
};

runSetup().then(() => console.log('Done 💫'));
