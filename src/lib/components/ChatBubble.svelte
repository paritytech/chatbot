<script lang="ts">
	export let isQuestion: boolean;
	import icon from '$lib/assets/substrate.png';
</script>

<div class={`chat ${isQuestion ? 'chat-end' : 'chat-start'}`}>
	{#if !isQuestion}
		<div class="chat-header">Polkadot Bot</div>
		<div class="chat-image avatar">
			<div class="w-10 rounded-full">
				<img src={icon} alt="substrate icon" />
			</div>
		</div>
	{/if}
	<div class="chat-bubble max-w-full prose dark:text-white" class:chat-bubble-accent={!isQuestion} class:chat-bubble-info={isQuestion}>
		<slot />
	</div>
</div>
