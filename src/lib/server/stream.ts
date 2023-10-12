import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: OPENAI_API_KEY
});

export const chatStream = async (payload: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming) => {
	const stream = await openai.chat.completions.create(payload);

	const streamResponse = new ReadableStream({
		async start(controller) {
			for await (const part of stream) {
				const [data] = part.choices;
				console.log("response", data);
				if (data.finish_reason === "stop") {
					controller.close();
				} else {
					controller.enqueue(data.delta.content)
				}
			}
		}
	});
	return streamResponse;
}
