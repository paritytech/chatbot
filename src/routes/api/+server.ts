import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateCompletion } from '$lib/server/chatbot';

export const POST: RequestHandler = (async ({ request }) => {
	const body = (await request.json()) as { question: string };
	console.log('query is', body.question);

	try {
		const answer = await generateCompletion(body.question);

		return new Response(String(answer));
	} catch (e) {
		console.error(e);
		throw error(500, `Error while parsing query: ${body.question}`);
	}
}) satisfies RequestHandler;
