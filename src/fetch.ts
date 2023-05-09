import "https://deno.land/std@0.186.0/dotenv/load.ts";
import { Octokit } from "npm:@octokit/rest";

const octokit = new Octokit({ auth: Deno.env.get("GITHUB_TOKEN") });

const repo = { owner: Deno.env.get("ORG") as string, repo: Deno.env.get("REPO") as string };

const { data: { login }, } = await octokit.rest.users.getAuthenticated();
console.log("Hello, %s. Let's fetch the docs for %s", login, `${repo.owner}/${repo.repo}`);


const { data } = await octokit.rest.git.getTree({ ...repo, tree_sha: "master", recursive: "true" });


const docFilters = ({ path }: { path?: string }): boolean => {
    if (!path) {
        return false;
    }

    if (!path.endsWith(".md")) {
        return false;
    }

    if (path.substring(0, 5) !== "docs/") {
        return false;
    }

    return true;
}

console.log('Found', data.tree.length, "files");

const cleanedFiles = data.tree.filter(docFilters);

console.log('After parsing,', cleanedFiles.length, "files");

Deno.mkdir("data/docs/", { recursive: true })

for (let i = 0; i < cleanedFiles.length; i++) {
    const file = cleanedFiles[i];
    const { data } = await octokit.rest.repos.getContent({
        ...repo,
        path: file.path as string,
    });
    console.log(`Downloading ${file.path}.`, cleanedFiles.length - i, "files remaining.");
    // @ts-ignore: download_url exists but for some reason it is telling it does not
    const { download_url } = data;
    const textResponse = await fetch(download_url);
    const textData = await textResponse.text();
    await Deno.writeTextFile(`data/docs/${file.path?.replaceAll("/", "-")}`, textData);
}
