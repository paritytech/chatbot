import { getCompletationData } from '$lib/server/chatbot';
import { chatStream } from '$lib/server/stream';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = (async ({ request }) => {
	const body = (await request.json()) as { question: string };
	console.log('query is', body.question);

	try {
		const completion = await getCompletationData(body.question);

		const stream = await chatStream(completion);

		return new Response(stream);
	} catch (e) {
		console.error(e);
		throw error(500, `Error while parsing query: ${body.question}`);
	}
}) satisfies RequestHandler;
