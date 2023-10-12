import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import embeddingStoreJSON from '../../../data/embeddings/polkadot-test.json';
import systemContent from "../../../data/chatbot-configuration.txt?raw";

if (!OPENAI_API_KEY) {
	throw new Error('No api key');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Config Variables
let embeddingStore: { [key: string]: { embedding: number[]; created: number } } = {};

const maxTokens = 300; // Just to save my money :')
let embeddedQuestion;

const createPrompt = (question: string, paragraph: string[]) => {
	// console.debug("paragraph", paragraph.join("\n\n"));

	return (
		'Answer the following question, also use your own knowledge when necessary :\n\n' +
		'Context :\n' +
		paragraph.join('\n\n') +
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

// Removes the prefix from paragraph
const keyExtractParagraph = (key: string) => {
	return key;
	// return key.substring(embeds_storage_prefix.length);
};

// Calculates the similarity score of question and context paragraphs
const compareEmbeddings = (embedding1: number[], embedding2: number[]) => {
	var length = Math.min(embedding1.length, embedding2.length);
	var dotprod = 0;

	for (var i = 0; i < length; i++) {
		dotprod += embedding1[i] * embedding2[i];
	}

	return dotprod;
};

// Loop through each context paragraph, calculates the score, sort using score and return top count(int) paragraphs
const findClosestParagraphs = (questionEmbedding: number[], count: number) => {
	var items = [];

	for (const key in embeddingStore) {
		let paragraph = keyExtractParagraph(key);

		let currentEmbedding = embeddingStore[key].embedding;

		items.push({
			paragraph: paragraph,
			// score: distances_from_embeddings(questionEmbedding, currentEmbedding, "Linf"),
			score: compareEmbeddings(questionEmbedding, currentEmbedding)
		});
	}

	items.sort(function (a, b) {
		return b.score - a.score;
	});

	return items.slice(0, count).map((item) => item.paragraph);
};

export const getCompletationData = async (prompt: string): Promise<OpenAI.Chat.ChatCompletionCreateParamsStreaming> => {
	// Retrieve embedding store and parse it
	embeddingStore = embeddingStoreJSON as {
		[key: string]: { embedding: number[]; created: number };
	};

	// Embed the prompt using embedding model

	let embeddedQuestionResponse = await openai.embeddings.create({
		input: prompt,
		model: 'text-embedding-ada-002'
	});

	// Some error handling
	if (embeddedQuestionResponse.data.length) {
		embeddedQuestion = embeddedQuestionResponse.data[0].embedding;
	} else {
		throw Error('Question not embedded properly');
	}

	// Find the closest count(int) paragraphs
	let closestParagraphs = findClosestParagraphs(embeddedQuestion, 5); // Tweak this value for selecting paragraphs number

	return {
		model: 'gpt-3.5-turbo',
		messages: [
			{
				role: 'system',
				content: systemContent
			},
			{
				role: 'user',
				content: createPrompt(prompt, closestParagraphs)
			}
		],
		// max_tokens: maxTokens,
		temperature: 0, // Tweak for more random answers,
		stream: true
	};
};
