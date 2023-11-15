import { OPENAI_API_KEY } from '$env/static/private';
import { weaviateClient } from '$lib/server/chatbot';
import OpenAI from 'openai';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const openAi = new OpenAI({apiKey: OPENAI_API_KEY});
	const models = await openAi.models.list();
	console.log("There are %s available OpenAI models", models.data.length);
	const result = await weaviateClient.schema.getter().do();
	if (!result) {
		throw new Error('Weaviate not configured correctly!');
	}
	return new Response('Ok', { status: 200 });
};
