import { OPENAI_API_KEY, WEAVIATE_PROTOCOL, WEAVIATE_URL } from '$env/static/private';
import OpenAI from 'openai';
import weaviate from 'weaviate-ts-client';
import systemContent from '$lib/server/chatbot-configuration.txt?raw';

export const weaviateClient = weaviate.client({
	scheme: WEAVIATE_PROTOCOL,
	host: WEAVIATE_URL
});

if (!OPENAI_API_KEY) {
	throw new Error('No api key');
}

type SourceData = { content: string; source: string };

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

let embeddedQuestion;

const createPrompt = (question: string, data: SourceData[]) => {
	const groupContent = data.map(
		({ content, source }) => content + (source ? `\nSource: ${source}` : '\n')
	);

	return (
		'Answer the following question, also use your own knowledge when necessary :\n\n' +
		'Context :\n' +
		groupContent.join('\n\n') +
		'\n\nQuestion :\n' +
		question +
		'?' +
		'\n\nAnswer :'
	);
};

export const getCompletationData = async (
	prompt: string
): Promise<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming> => {
	// Embed the prompt using embedding model

	const embeddedQuestionResponse = await openai.embeddings.create({
		input: prompt,
		model: 'text-embedding-ada-002'
	});

	// Some error handling
	if (embeddedQuestionResponse.data.length) {
		embeddedQuestion = embeddedQuestionResponse.data[0].embedding;
	} else {
		throw Error('Question not embedded properly');
	}

	const result = await weaviateClient.graphql
		.get()
		.withClassName('Question')
		.withNearVector({ vector: embeddedQuestion })
		.withLimit(5)
		.withFields('text source')
		.do();

	// Find the closest count(int) paragraphs
	const data = result.data.Get.Question.map(
		(q: { text: string; source: string }) => ({ content: q.text, source: q.source }) as SourceData
	);

	return {
		model: 'gpt-3.5-turbo',
		messages: [
			{
				role: 'system',
				content: systemContent
			},
			{
				role: 'user',
				content: createPrompt(prompt, data)
			}
		],
		// max_tokens: maxTokens,
		temperature: 0 // Tweak for more random answers,
	};
};

export const askQuestion = async (prompt: string): Promise<string> => {
	const completion = await getCompletationData(prompt);
	const answer = await openai.chat.completions.create(completion);
	return answer.choices[0].message.content ?? 'Error';
};
