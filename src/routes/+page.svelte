<script lang="ts">
	import axios from 'axios';
	import Chat from '$lib/components/Chat.svelte';
	import { tick } from 'svelte';
	import { askQuestion as askStream } from '$lib/util/handleQueryStream';

	import { highlightAll } from 'prismjs';
	import ChatBubble from '$lib/components/ChatBubble.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';

	let interaction: [string, 'user' | 'assistant'][] = [];

	let qAndA: { question: boolean; text: string }[] = [];
	let chat: HTMLElement;
	let loading: boolean;
	let errorMsg: string;
	let thread: string;

	// answer streamed on real time before being parsed by the markdown parser
	let streamAnswer: string = '';

	const scrollToBottom = async (node: HTMLElement) => {
		node.scroll({ top: node.scrollHeight, behavior: 'smooth' });
	};

	const handler: SubmitFunction = ({ formData }) => {
		const query = formData.get('prompt');
		interaction = [...interaction, [query as string, 'user']];
		if (thread) {
			formData.append('thread', thread);
		}
		loading = true;

		return async ({ update, result }) => {
			if (result.type === 'error') {
				errorMsg = JSON.stringify(result.error);
				return;
			} else if (result.type === 'failure') {
				errorMsg = result.data?.message ?? 'An unknown error ocurred';
				return;
			}
			// @ts-ignore data does exist
			const data = result.data as { answer: string; threadId: string };
			interaction = [...interaction, [data.answer, 'assistant']];
			thread = data.threadId;
			console.log('result is:', data);
			loading = false;

			// Wait half a second for the text to render
			await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
			// Scroll to the bottom of the chat
			chat.scroll({ top: chat.scrollHeight, behavior: 'smooth' });
		};
	};
</script>

<main>
	<div class="hero min-h-screen bg-base-200">
		<div class="hero-content flex-col lg:flex-row-reverse max-w-screen-xl gap-8">
			<div class="text-center lg:text-left">
				<h1 class="text-5xl font-bold">Polkadot! Chatbot</h1>
				<p class="pt-6">Ask me anything about Polkadot</p>
				<p>Pre alpha Proof of Concept. Expect chaos</p>
				<ul class="list-disc">
					<li>Doesn't have memory. You can not do follow up questions</li>
					<li>Doesn't properly format Markdown</li>
					<li>
						It only knows things that are available in
						<a class="link" href="https://wiki.polkadot.network"> wiki.polkadot.network </a>
					</li>
				</ul>
			</div>
			<div class="chat-column">
				<div class="card-body chat-container">
					<div class="overflow-y-auto" bind:this={chat}>
						{#each interaction as [chat, role]}
							<Chat text={chat} isQuestion={role === 'user'} />
						{/each}
						{#if loading}
							<ChatBubble isQuestion={false}>
								<span class="loading loading-dots loading-lg"></span>
							</ChatBubble>
						{:else}
							<form
								class="card-body mt-8 grid grid-cols-3 gap-4"
								method="POST"
								use:enhance={handler}
							>
								<input
									type="text"
									minlength="10"
									maxlength="400"
									placeholder="What is Polkadot?"
									name="prompt"
									class="input input-bordered w-full max-w-xs col-span-2"
									required
								/>
								<button class="btn btn-primary" type="submit" disabled={loading}>Ask</button>
							</form>
						{/if}
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
