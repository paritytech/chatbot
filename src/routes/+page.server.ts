import { askQuestion } from '$lib/server/assitant';

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const question = form.get('prompt') as string;
		const thread = form.get("thread") as string;
		console.log('Asking question:', question);
		const answer = await askQuestion(question, thread ?? undefined);

		return answer;
	}
};
