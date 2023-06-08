import { OPENAI_API_KEY } from '$env/static/private';
import { createParser, type ParseEvent } from 'eventsource-parser';
import type { CreateChatCompletionRequest } from 'openai';

export const OpenAIStream = async (payload: CreateChatCompletionRequest) => {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	let counter = 0;

	const res = await fetch('https://api.openai.com/v1/chat/completions', {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${OPENAI_API_KEY}`
		},
		method: 'POST',
		body: JSON.stringify(payload)
	});

	const stream = new ReadableStream({
		async start(controller) {
			function onParse(event: ParseEvent) {
				if (event.type === 'event') {
					const data = event.data;
					// https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
					if (data === '[DONE]') {
						controller.close();
						return;
					}
					try {
						const json = JSON.parse(data);
						const text = json.choices[0].delta?.content || '';
						if (counter < 2 && (text.match(/\n/) || []).length) {
							// this is a prefix character (i.e., "\n\n"), do nothing
							return;
						}
						const queue = encoder.encode(text);
						controller.enqueue(queue);
						counter++;
					} catch (e) {
						// maybe parse error
						controller.error(e);
					}
				}
			}

			// stream response (SSE) from OpenAI may be fragmented into multiple chunks
			// this ensures we properly read chunks and invoke an event for each SSE event stream
			const parser = createParser(onParse);
			if (!res.body) {
				throw new Error('Body is null!');
			}
			// https://web.dev/streams/#asynchronous-iteration
			for await (const chunk of res.body) {
				parser.feed(decoder.decode(chunk));
			}
		}
	});
	return stream;
};
