import { weaviateClient } from "$lib/server/chatbot";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const result = await weaviateClient
        .schema
        .getter()
        .do();
    if (!result) {
        throw new Error("Weaviate not configured correctly!");
    }
    return new Response("Ok", { status: 200 });
};
