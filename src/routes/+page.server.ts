import { askQuestion } from '$lib/server/chatbot.js';

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const question = form.get('prompt') as string;
		console.log('Asking question:', question);
		const answer = await askQuestion(question);

		return answer;
	}
};
