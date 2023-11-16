import { Octokit } from '@octokit/rest';
import axios from 'axios';
import { mkdir, writeFile } from 'fs/promises';
import { env } from './env';

const docsSource = 'https://wiki.polkadot.network/docs/';

/**
 * Removes import arguments and adds the source to the document
 * @param {string} content Markdown content to remove non markdown text
 * @returns {string} The parsed markdown content
 */
const handleMarkdownContent = (content: string) => {
	// Remove any line starting with a
	const removedImports = content.replace(/import.+".+/g, '');
	const withSource = removedImports.replace(/slug: [?:../]+/, `source: ${docsSource}`);

	return withSource;
};

/**
 * Fetches the docs from GitHub
 * @returns {Promise<string>}
 */
export const fetchDocs = async (): Promise<string> => {
	const repo = {
		owner: env.ORG,
		repo: env.REPO
	};

	const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

	const {
		data: { login }
	} = await octokit.rest.users.getAuthenticated();
	console.log("Hello, %s. Let's fetch the docs for %s", login, `${repo.owner}/${repo.repo}`);

	const {
		data: { default_branch }
	} = await octokit.rest.repos.get({ ...repo });

	const { data } = await octokit.rest.git.getTree({
		...repo,
		tree_sha: default_branch,
		recursive: 'true'
	});

	/**
	 *
	 * @param {{path?:string}} param0
	 * @returns {boolean}
	 */
	const docFilters = ({ path }: { path?: string }): boolean => {
		if (!path) {
			return false;
		}

		if (!path.endsWith('.md')) {
			return false;
		}

		if (path.substring(0, 5) !== 'docs/') {
			return false;
		}

		return true;
	};

	console.log('Found', data.tree.length, 'files');

	const cleanedFiles = data.tree.filter(docFilters);

	console.log('After parsing,', cleanedFiles.length, 'files');

	mkdir('data/docs/', { recursive: true });

	/**
	 * @type {{fileName:string,content:string}[]}
	 */
	const filenames: { fileName: string; content: string }[] = [];

	for (let i = 0; i < cleanedFiles.length; i++) {
		const file = cleanedFiles[i];
		/** @type {{data: {download_url:string}}} */
		const { data } = await octokit.rest.repos.getContent({
			...repo,
			path: file.path as string
		});
		console.log(`Downloading ${file.path} -`, cleanedFiles.length - i, 'files remaining 📂');

		const { download_url } = data as { download_url: string };

		/** @type {import("axios").AxiosResponse<string>} */
		const textResponse = await axios.get(download_url);
		const textData = textResponse.data;
		const fileName = `data/docs/${file.path?.replaceAll('/', '-')}`;
		const content = handleMarkdownContent(textData);
		await writeFile(fileName, content);
		filenames.push({ fileName, content });
	}

	const combinedDocName = 'data/combined-doc.md';
	await writeFile(combinedDocName, `# Wiki\n\n${filenames.map((f) => f.content).join('\n\n')}`);

	return combinedDocName;
};
