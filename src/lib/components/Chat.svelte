<script lang="ts">
	export let isQuestion: boolean;
	export let text: string;
	import { marked } from 'marked';
	import ChatBubble from './ChatBubble.svelte';

	const parsedText = marked.parse(text);
</script>

<ChatBubble {isQuestion}>
	{@html parsedText}
</ChatBubble>
