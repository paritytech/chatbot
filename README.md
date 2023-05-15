# ChatBot

This is an interactive AI-based tool designed to answer questions about Substrate and related technologies. It leverages OpenAI's GPT models and the data in Substrate's GitHub repositories along with the documentation to provide accurate, context-aware responses to user queries.

[![Substrate](https://img.shields.io/badge/Substrate-100000?style=flat&logo=polkadot&logoColor=E6007A&labelColor=000000&color=21CC85)](https://github.com/paritytech/substrate)
[![License: Apache](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Table of Contents

* [Downloading the Files](#how-to-download-files)
* [Generating Embeddings](#how-to-generate-the-embeddings)
* [Running the Chatbot](#run-the-chatbot)

## How to download files

To download the necessary files for the chatbot, you need to create an environment variable file, `.env`, with the following values:

```env
GITHUB_TOKEN=<token>
REPO=<repo-name>
ORG=paritytech
```

After creating this file, run the following command:

```bash
deno run --allow-read --allow-env --allow-write=data/ --allow-net src/fetch.ts
```

This command will fetch the necessary files from the specified repositories and the docs.

## How to generate the embeddings

The chatbot relies on embeddings to understand and generate responses. To create these embeddings, you need to set up another environment variable in the `.env` file:

```env
OPENAI_API_KEY=<api-key>
```

Then, run the following command:

```bash
deno run --allow-read=data --allow-end --allow-write=data/ --allow-net src/embed.ts
```

Ensure that the data was downloaded in the previous step, as the embedding generation relies on this data.

## Run the chatbot

To start the chatbot, you need to set up the `OPENAI_API_KEY` variable value in your `.env` file, unless you did so in the previous step:

```env
OPENAI_API_KEY=<api-key>
```

Then, run the following command:

```bash
deno run --allow-read=data --allow-env src/chatbot.ts`
```

Before running this command, please make sure that the embeddings were generated in the previous step.

## License

This project is licensed under the Apache-2.0 License. For more details, see the [LICENSE](LICENSE) file.

## Acknowledgements

This project is the result of conversations and code experimentation between Javier Bullrich (@Bullrich) and Ben Greenberg (@hummusonrails). We would also like to acknowledge Kian Paimani (@kianenigma) and Daan van der Plas (@Daanvdplas) for their thoughts and contributions to this project.