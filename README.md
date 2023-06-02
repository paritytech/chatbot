# ChatBot

This is an interactive AI-based tool designed to answer questions about Substrate and related technologies. It leverages OpenAI's GPT models and the data in Substrate's GitHub repositories along with the documentation to provide accurate, context-aware responses to user queries.

[![Substrate](https://img.shields.io/badge/Substrate-100000?style=flat&logo=polkadot&logoColor=E6007A&labelColor=000000&color=21CC85)](https://github.com/paritytech/substrate)
[![License: Apache](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## How to setup the project

First run `npm install` from the root of the project to download all of the project dependencies.

After this, you need to ensure that you have the necessary environment variables set up. The project comes with a sample environment variable file, `example.env`, which you can use as a template. You can copy it to `.env` and fill in the necessary values.

The environment file needs to have the following values:

```env
REPO=<repo-name>
ORG=paritytech
GITHUB_TOKEN=<token-with-repo-access>
OPENAI_API_KEY=<api-key>
```

For example, if you are creating an interactive chatbot for Substrate, you would set the following values:

```env
REPO=substrate
ORG=paritytech
```

You also need to include your OpenAI API key. You can get one by signing up for an account at [OpenAI](https://openai.com/). You also require a **GitHub token** with repo access. You can create one by following the instructions [here](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token). Add them to your `.env` file with the following keys:

```env
GITHUB_TOKEN=
OPENAI_API_KEY=
```

Once that is all completed, you can run the following command to download all the necessary files and generate the embeddings:

```bash
npm run setup
```

## Run server

You can run the web server to ask questions. For this you need to run the following command.

In order, run in the root directory the following commands:

```bash
npm run dev
```

This will build your project and make it available at http://localhost:5173

## Run CLI

If you don't require a web server and just want to interact from your terminal, you can use the available Command Line Interface.

Create an env file:

```env
OPENAI_API_KEY=<api-key>
```

Run `npm run ask`

Before running this command, please make sure that the embeddings were generated in the previous step.

The chatbot will ask you to enter a question. Once you enter a question, it will query the OpenAI API and return the most relevant answer. You can run this command again to ask another question.

## License

This project is licensed under the Apache-2.0 License. For more details, see the [LICENSE](LICENSE) file.

## Acknowledgements

This project is the result of conversations and code experimentation between Javier Bullrich (@Bullrich) and Ben Greenberg (@hummusonrails). We would also like to acknowledge Kian Paimani (@kianenigma) and Daan van der Plas (@Daanvdplas) for their thoughts and contributions to this project.
