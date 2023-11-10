import { envsafe, str } from 'envsafe';

export const env = envsafe({
	GITHUB_TOKEN: str({}),
	REPO: str({
		devDefault: 'polkadot-wiki',
		desc: 'The repo to fetch the docs from'
	}),
	ORG: str({
		devDefault: 'w3f',
		desc: 'The org to which the repo belongs'
	}),
	OPENAI_API_KEY: str({
		desc: 'Open AI API key'
	}),
	WEAVIATE_URL: str({
		devDefault: 'localhost:8080',
		desc: 'Location of weaviate'
	}),
	WEAVIATE_PROTOCOL: str({
		devDefault: 'http',
		desc: 'Protocol of weaviate (usually http or https)'
	})
});
