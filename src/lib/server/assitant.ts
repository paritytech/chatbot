import { ASSISTANT_ID, OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';

const ai = new OpenAI({ apiKey: OPENAI_API_KEY });

const createThread = async (prompt: string) => {
	const thread = await ai.beta.threads.create({
		messages: [
			{
				role: 'user',
				content: prompt
			}
		]
	});

	return thread.id;
};

export const askQuestion = async (
	question: string,
	threadId?: string
): Promise<{ answer: string; threadId: string }> => {
	if (threadId) {
		await ai.beta.threads.messages.create(threadId, { content: question, role: 'user' });
	} else {
		threadId = await createThread(question);
	}
	console.log('Working on question', question);
	let run = await ai.beta.threads.runs.create(threadId, { assistant_id: ASSISTANT_ID });

	console.log('Check status of run', run.id);
	console.time(run.id);
	do {
		run = await ai.beta.threads.runs.retrieve(run.thread_id, run.id);
		await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
	} while (run.status === 'in_progress' || run.status === 'queued');

	if (run.status !== 'completed') {
		throw new Error(`Failed with unexpected status: ${run.status}`);
	}

	console.timeEnd(run.id);

	const message = await ai.beta.threads.messages.list(run.thread_id);

	const [content] = message.data[0].content;
	if (content.type !== 'text') {
		console.error("System didn't produce a text", content);
		throw new Error('Wrong content type');
	}

	return { answer: content.text.value, threadId };
};
