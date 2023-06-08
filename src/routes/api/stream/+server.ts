import { getCompletationData } from '$lib/server/chatbot.js';
import { OpenAIStream } from '$lib/server/stream';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { question: string };

	console.log('received question', body.question);

	const completion = await getCompletationData(body.question);

	const stream = await OpenAIStream(completion);
	return new Response(stream);
};
