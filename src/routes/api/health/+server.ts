import { dbLocation } from "$lib/server/chatbot";
import { LocalIndex } from "vectra";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
    const index = new LocalIndex(dbLocation);
    if (await index.isIndexCreated()) {

        return new Response("Ok", { status: 200 });
    }
    throw new Error("Vectra Index connection error!");
};
