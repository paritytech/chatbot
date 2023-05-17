import prompts from "prompts";
import { generateCompletion } from './chatbot';


(async () => {
  const question = await prompts({
    type:"text",
    name:"query",
    message: "What is your question?"
  });

  await generateCompletion(question.query);
})();
