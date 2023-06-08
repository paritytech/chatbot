import nodeAdapter from '@sveltejs/adapter-node';
import vercelAdapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/kit/vite';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [
		vitePreprocess(),
		preprocess({
			postcss: true
		})
	],

	kit: {
		// adapter set up automatically based on the platform
		adapter: process.env.VERCEL ? vercelAdapter({ runtime: 'edge' }) : nodeAdapter()
	}
};

export default config;
