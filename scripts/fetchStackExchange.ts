import axios from "axios";
import { existsSync, mkdirSync } from "fs";

import { readFile, writeFile } from "fs/promises";

interface QuestionWithBody {
    is_answered: boolean;
    view_count: number;
    accepted_answer_id: number;
    score: number;
    answer_count: number;
    question_id: number;
    link: string;
    title: string;
    body: string;
    body_markdown: string;
}

interface Answer {
    is_accepted: boolean;
    score: number;
    answer_id: number;
    question_id: number;
    body: string;
    body_markdown: string;
}

interface StackExchangeInfo {
    question_id: number;
    answer_id: number;
    title: string;
    body: string;
    answer: string;
    url: string;
    answer_url: string;
}

const site = "substrate.stackexchange";

const axiosGet = async<T = any>(url: string, params: URLSearchParams): Promise<T> => {
    const requestUrl = url + "?" + params.toString();
    try {
        console.log("About to get 📃 from:", requestUrl);
        const { data } = await axios.get<T>(requestUrl);

        console.debug(data);

        return data;
    }
    catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error(error.response.data);
            console.error(error.response.status);
            throw new Error(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser 
            // and an instance of http.ClientRequest in node.js
            console.error(error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error', error.message);
        }
        throw error;
    }
}

/**
 * Fetch the top 99 Stack Exchange questions and writes them down into a markdown file
 */
export const fetchQuestions = async (): Promise<string> => {
    const url = "https://api.stackexchange.com/2.3/questions";

    const params = new URLSearchParams();
    params.append('pagesize', '99');
    params.append('order', 'desc');
    params.append('sort', 'votes');
    params.append('site', site);
    params.append('filter', '!1ZFzxYL2ELUKqhj_*4sTn2BvPAtLgsEA.');

    const questions = await axiosGet<{ items: QuestionWithBody[] }>(url, params);

    console.log(questions.items[0]);

    const answerParams = new URLSearchParams();
    answerParams.append('site', site);
    answerParams.append('filter', '!-)QWsboN0d_T');

    mkdirSync('data/se/', { recursive: true });

    const answers: StackExchangeInfo[] = [];

    for (const question of questions.items.filter(q => q.is_answered)) {
        // Skip undefined questions
        if (!question.question_id) {
            continue;
        }

        if (!question.accepted_answer_id) {
            console.log("Skipping #%s '%s' because it does not have an accepted answer", question.question_id, question.title);
            continue;
        }

        const fileName = `data/se/${question.question_id}.json`;

        if (existsSync(fileName)) {
            console.log(`Found back up for #${question.question_id}. Using file in disk`);
            const file = await readFile(fileName, "utf-8");
            answers.push(JSON.parse(file) as StackExchangeInfo);
            continue;
        }

        const url = "https://api.stackexchange.com/2.3/answers/" + question.accepted_answer_id;
        console.log("Getting answer from: '%s'", question.title);
        const answer = await axiosGet<{ items: Answer[] }>(url, answerParams);
        console.log("ANSWER!", answer.items);
        const pair: StackExchangeInfo = {
            question_id: question.question_id,
            answer_id: question.accepted_answer_id,
            title: question.title,
            body: question.body_markdown,
            answer: answer.items[0].body_markdown,
            url: question.link,
            answer_url: `https://${site}.com/a/${question.accepted_answer_id}`
        }
        await writeFile(fileName, JSON.stringify(pair, null, 2));
        answers.push(pair);
    }

    const combination = answers.map(answer => `# ${answer.title}

## Question

${answer.body}

## Answer

Answer source: ${answer.answer_url}

${answer.answer}`).join("\n\n---\n\n");

    const combinedFile = "data/stackExchangeCombinedDoc.md";

    await writeFile(combinedFile,
        "This document contains answers from https://substrate.stackexchange.com. They are separated with a '---'\n\n" +
        combination);

    return combinedFile;
}
