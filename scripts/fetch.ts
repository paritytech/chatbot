import { Octokit } from "@octokit/rest";
import axios from "axios";
import { mkdir, writeFile } from "fs/promises";

export const fetchDocs = async () => {
    const repo = {
        owner: process.env.ORG as string,
        repo: process.env.REPO as string,
    };

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const { data: { login } } = await octokit.rest.users.getAuthenticated();
    console.log(
        "Hello, %s. Let's fetch the docs for %s",
        login,
        `${repo.owner}/${repo.repo}`,
    );

    const { data: { default_branch } } = await octokit.rest.repos.get({ ...repo });

    const { data } = await octokit.rest.git.getTree({
        ...repo,
        tree_sha: default_branch,
        recursive: "true",
    });

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
    };

    console.log("Found", data.tree.length, "files");

    const cleanedFiles = data.tree.filter(docFilters);

    console.log("After parsing,", cleanedFiles.length, "files");

    mkdir("data/docs/", { recursive: true });

    for (let i = 0; i < cleanedFiles.length; i++) {
        const file = cleanedFiles[i];
        const { data } = await octokit.rest.repos.getContent({
            ...repo,
            path: file.path as string,
        });
        console.log(
            `Downloading ${file.path} -`,
            cleanedFiles.length - i,
            "files remaining 📂",
        );
        // @ts-ignore: download_url exists but for some reason it is telling it does not
        const { download_url } = data;
        const textResponse = await axios.get<string>(download_url);
        const textData = textResponse.data;
        await writeFile(
            `data/docs/${file.path?.replaceAll("/", "-")}`,
            textData,
        );
    }
}
