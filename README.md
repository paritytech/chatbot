# ChatBot

## How to download files

Create an env file:

```env
GITHUB_TOKEN=<token>
REPO=<repo-name>
ORG=paritytech
```

Run `deno run --allow-read --allow-env --allow-write=data/ --allow-net src/fetch.ts`

## How to generate the embeddings

Create an env file:

```env
OPENAI_API_KEY=<api-key>
```

Run `deno run --allow-read=data --allow-end --allow-write=data/ --allow-net src/embed.ts`

Be sure that the data was downloaded on the previous step.

## Run chatbot

Create an env file:

```env
OPENAI_API_KEY=<api-key>
```

Run `deno run --allow-read=data --allow-env src/chatbot.ts`

Be sure that the data was generated in the previous step.
