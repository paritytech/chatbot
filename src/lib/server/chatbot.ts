import { OPENAI_API_KEY, WEAVIATE_PROTOCOL, WEAVIATE_URL } from '$env/static/private';
import OpenAI from 'openai';
import weaviate from 'weaviate-ts-client';

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

const createPrompt = (question: string, data: SourceData[]): string => {
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

/** Finds the related information in the vector database and formats the prompt to have context */
export const formatPromptWithData = async (prompt: string): Promise<string> => {
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
		.withLimit(2)
		.withFields('text source')
		.do();

	// Find the closest count(int) paragraphs
	const data = result.data.Get.Question.map(
		(q: { text: string; source: string }) => ({ content: q.text, source: q.source }) as SourceData
	);

	return createPrompt(prompt, data);
};
