import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import systemContent from '../../../data/chatbot-configuration.txt?raw';
import path from 'path';
import { fileURLToPath } from 'url';
import { LocalIndex } from 'vectra';

if (!OPENAI_API_KEY) {
	throw new Error('No api key');
}

type SourceData = { content: string; source: string };

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const dbLocation = path.join(path.parse(fileURLToPath(import.meta.url)).dir, '..', 'embeddings');

console.log('Connecting to index in', dbLocation);

const index = new LocalIndex(dbLocation);

let embeddedQuestion;

const createPrompt = (question: string, data: SourceData[]) => {
	// console.debug("paragraph", paragraph.join("\n\n"));

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

	// A sample prompt if you don't want it to use its own knowledge
	// rather answer only from data you've provided

	// return (
	//   "Answer the following question from the context, if the answer can not be deduced from the context, say 'I dont know' :\n\n" +
	//   "Context :\n" +
	//   paragraph.join("\n\n") +
	//   "\n\nQuestion :\n" +
	//   question +
	//   "?" +
	//   "\n\nAnswer :"
	// );
};

export const getCompletationData = async (
	prompt: string
): Promise<OpenAI.Chat.ChatCompletionCreateParamsStreaming> => {
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

	if (!(await index.isIndexCreated())) {
		console.log('Index is not created. Creating new one');
		await index.createIndex();
	}

	// Find the closest count(int) paragraphs
	const queryResult = await index.queryItems(embeddedQuestion, 5);
	console.log(embeddedQuestion.length, queryResult);
	const sourceData = queryResult.map(
		(q) =>
			({
				content: q.item.metadata.text as string,
				source: q.item.metadata.source as string
			}) as SourceData
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
				content: createPrompt(prompt, sourceData)
			}
		],
		// max_tokens: maxTokens,
		temperature: 0, // Tweak for more random answers,
		stream: true
	};
};
