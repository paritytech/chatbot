import express from 'express'
import { generateCompletion } from './chatbot';
import {join} from 'path';
const app = express()

const port = 3000;

app.use(express.json());

app.use(express.static('./client/dist'))

app.post('/query', async (req, res) => {
    const body = req.body as { question: string };
    console.log(body.question);
    const answer = await generateCompletion(body.question);
    res.send(answer);
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
