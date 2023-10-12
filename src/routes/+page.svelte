<script lang="ts">
	import axios from 'axios';
	import Chat from '$lib/components/Chat.svelte';
	import { tick } from 'svelte';
	import { askQuestion as askStream } from '$lib/util/handleQueryStream';

	import { highlightAll } from 'prismjs';
	import ChatBubble from '$lib/components/ChatBubble.svelte';

	let qAndA: { question: boolean; text: string }[] = [];
	let question: string = 'What is your name?';
	let request: Promise<string>;
	let input: HTMLElement;
	let chat: HTMLElement;
	let loading: boolean;

	// answer streamed on real time before being parsed by the markdown parser
	let streamAnswer: string = '';

	// $: loading = !!request;

	async function fetchQuestion(question: string): Promise<string> {
		const request = await axios.post<string>(
			'/api',
			{
				question
			},
			{
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
		return request.data;
	}

	const scrollToBottom = async (node: HTMLElement) => {
		node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
	};

	async function askQuestion() {
		loading = true;
		qAndA.push({ question: true, text: question });
		qAndA = qAndA;
		const queryAnswer = await askStream(question, (word) => {
			streamAnswer += word;
			// qAndA[currentAnswer].text += word;
			// qAndA = [...qAndA];

			console.log('answer to', question, qAndA);
		});
		streamAnswer = '';
		console.log('Complete answer is:', queryAnswer);
		qAndA.push({ question: false, text: queryAnswer });
		qAndA = qAndA;
		question = '';

		await tick();
		scrollToBottom(chat);
		// document.querySelectorAll('pre code').forEach((el) => {
		// 	console.log('highlighting', el);
		// 	// @ts-ignore
		// 	hljs.highlightElement(el);
		// });
		loading = false;
	}
</script>

<main>
	<div class="hero min-h-screen bg-base-200">
		<div class="hero-content flex-col lg:flex-row-reverse max-w-screen-xl gap-8">
			<div class="text-center lg:text-left">
				<h1 class="text-5xl font-bold">Ink! Chatbot</h1>
				<p class="pt-6">Ask me anything about Ink</p>
				<p>Pre alpha Proof of Concept. Expect chaos</p>
				<ul class="list-disc">
					<li>Doesn't have memory. You can not do follow up questions</li>
					<li>Doesn't properly format Markdown</li>
					<li>
						It only knows things that are available in <a class="link" href="https://use.ink"
							>use.ink</a
						>
					</li>
				</ul>
			</div>
			<div class="chat-column">
				<div class="card-body chat-container">
					<div class="overflow-y-auto" bind:this={chat}>
						{#each qAndA as text}
							<Chat text={text.text} isQuestion={text.question} />
						{/each}
						{#if streamAnswer}
							<ChatBubble isQuestion={false}>
								{streamAnswer}
							</ChatBubble>
						{/if}

						{#if request}
							{#await request}
								<div class="chat chat-start">
									<div class="chat-bubble">
										<div role="status">
											<div class="animate-pulse flex space-x-4">
												<div class="flex-1 space-y-6 py-1">
													<div class="space-y-3">
														<div class="h-2 bg-slate-200 rounded" />
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							{:catch error}
								<div class="chat chat-start">
									<div class="chat-bubble chat-bubble-error">
										{error.message}
									</div>
								</div>
							{/await}
						{/if}

						<div class="mt-8 grid grid-cols-3 gap-4">
							<input
								type="text"
								bind:value={question}
								placeholder="Type your question"
								class="input input-bordered w-full max-w-xs col-span-2"
								bind:this={input}
								disabled={loading}
							/>
							<button class="btn" on:click={askQuestion} disabled={loading} class:loading
								>Ask</button
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<style lang="postcss">
	.chat-container {
		max-height: 80vh;
	}

	.chat-column {
		@apply card flex-shrink-0 w-full max-w-lg shadow-2xl bg-base-100 grow;
		min-width: 30vw;
	}
</style>
