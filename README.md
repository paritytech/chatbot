# ChatBot

This is an interactive AI-based tool designed to answer questions about Substrate and related technologies. It leverages OpenAI's GPT models and the data in Substrate's GitHub repositories along with the documentation to provide accurate, context-aware responses to user queries.

[![Substrate](https://img.shields.io/badge/Substrate-100000?style=flat&logo=polkadot&logoColor=E6007A&labelColor=000000&color=21CC85)](https://github.com/paritytech/substrate)
[![License: Apache](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## How to setup the project

To download the necessary files for the chatbot, you need to create an environment variable file, `.env`, with the following values:

```env
REPO=<repo-name>
ORG=paritytech
GITHUB_TOKEN=<token-with-repo-access>
OPENAI_API_KEY=<api-key>
```

Run `npm run setup` on your terminal. This will download all the neccesary files and generate the embeddings.

## Run chatbot

Create an env file:

```env
OPENAI_API_KEY=<api-key>
```

Run `npm run ask`

Before running this command, please make sure that the embeddings were generated in the previous step.

## License

This project is licensed under the Apache-2.0 License. For more details, see the [LICENSE](LICENSE) file.

## Acknowledgements

This project is the result of conversations and code experimentation between Javier Bullrich (@Bullrich) and Ben Greenberg (@hummusonrails). We would also like to acknowledge Kian Paimani (@kianenigma) and Daan van der Plas (@Daanvdplas) for their thoughts and contributions to this project.
