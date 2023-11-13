import { OPENAI_API_KEY } from '$env/static/private';
import files from "$lib/server/docs.json";
import systemContent from '$lib/server/instructions.txt?raw';
import OpenAI from 'openai';

const ai = new OpenAI({ apiKey: OPENAI_API_KEY });

const getAnswer = async (question: string) => {
    const assistant = await ai.beta.assistants.create({
        name: "Polkadot Chatbot",
        instructions: systemContent,
        model: "gpt-4-1106-preview",
        tools: [{ "type": "retrieval" }],
        file_ids: files.map(file => file.id)
    });

    const thread = await ai.beta.threads.create({
        messages: [{
            role: "user",
            content: question,
            file_ids: files.map(file => file.id),
        }]
    });


    console.log("Asking question", thread.id);

    let run = await ai.beta.threads.runs.create(
        thread.id,
        { assistant_id: assistant.id }
    );

    console.log("Check status of run", run.id);
    while (run.status !== "completed") {
        run = await ai.beta.threads.runs.retrieve(
            run.thread_id,
            run.id
        );
    }

    console.log("That took a minute")

    console.log(run);

    const message = await ai.beta.threads.messages.list(run.thread_id);

    const [content] = message.data[0].content;
    if (content.type === "text") {
        return content.text.value;
    } else {
        console.log("System produced an image:", content.image_file);
        return content.image_file.file_id;
    }
};
