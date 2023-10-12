export const askQuestion = async (
	question: string,
	callback?: (word: string) => void
): Promise<string> => {
	try {
		console.log('Sending query:', question);
		const response = await fetch('/api/stream', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ question })
		});

		if (response.ok) {
			try {
				let message: string = '';
				const data = response.body;
				if (!data) {
					console.warn('No data in response!');
					return message;
				}

				const reader = data.getReader();
				const decoder = new TextDecoder();

				while (true) {
					const { value, done } = await reader.read();
					const chunkValue = decoder.decode(value);

					console.log(chunkValue);

					message += chunkValue;
					if (callback) {
						callback(chunkValue);
					}

					if (done) {
						console.log('Done!', 'Finito!');
						return message;
					}
				}
			} catch (e) {
				throw new Error('Looks like OpenAI timed out :(');
			}
		} else {
			throw new Error(await response.text());
		}
	} catch (error) {
		console.log(error);
		throw error;
	}
};
