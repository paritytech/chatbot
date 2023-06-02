<script lang="ts">
	import axios from 'axios';
	import Chat from '$lib/components/Chat.svelte';
	import { tick } from 'svelte';

	import { highlightAll } from 'prismjs';

	let qAndA: { question: boolean; text: string }[] = [];
	let question: string;
	let request: Promise<string>;
	let input: HTMLElement;
	let chat: HTMLElement;
	let loading: boolean;

	$: loading = !!request;

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
		request = fetchQuestion(question);
		qAndA.push({ question: true, text: question });
		qAndA = qAndA;
		question = '';
		const data = await request;
		console.log(data);

		qAndA.push({ question: false, text: data });
		qAndA = qAndA;
		request = null;
		await tick();
		scrollToBottom(chat);
		document.querySelectorAll('pre code').forEach((el) => {
			console.log('highlighting', el);
			// @ts-ignore
			hljs.highlightElement(el);
		});
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
			<div class="card flex-shrink-0 w-full max-w-lg shadow-2xl bg-base-100 grow">
				<div class="card-body chat-container">
					<div class="overflow-y-auto" bind:this={chat}>
						{#each qAndA as text}
							<Chat text={text.text} isQuestion={text.question} />
						{/each}

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

<style>
	.chat-container {
		max-height: 80vh;
	}
</style>
