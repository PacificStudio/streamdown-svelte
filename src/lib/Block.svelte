<script lang="ts">
	import { parseIncompleteMarkdown } from './utils/parse-incomplete-markdown.js';
	import Element from './Elements/Element.svelte';
	import { lex, type StreamdownToken } from './marked/index.js';
	import AnimatedText from './AnimatedText.svelte';
	import { useStreamdown } from './context.svelte.js';
	import { getContext, setContext } from 'svelte';
	import { hasIncompleteCodeFence } from './utils/code-block.js';

	let {
		block,
		static: isStatic = false
	}: {
		block: string;
		static?: boolean;
	} = $props();

	const streamdown = useStreamdown();
	const isIncompleteCodeFence = $derived(streamdown.isAnimating && !isStatic && hasIncompleteCodeFence(block));
	const tokens = $derived(
		lex(isStatic ? block : parseIncompleteMarkdown(block.trim()), streamdown.extensions)
	);
	const insidePopover = getContext('POPOVER');

	setContext('STREAMDOWN_BLOCK', {
		get isIncompleteCodeFence() {
			return isIncompleteCodeFence;
		}
	});
</script>

{#snippet renderChildren(tokens: StreamdownToken[])}
	{#each tokens as token}
		{#if token}
			{@const children = (token as any)?.tokens || []}
			{@const isTextOnlyNode = children.length === 0}
			<Element {token}>
				{#if isTextOnlyNode}
					{#if streamdown.animation.enabled && !insidePopover && !isStatic}
						<AnimatedText text={'text' in token ? token.text || '' : ''} />
					{:else}
						{'text' in token ? token.text : ''}
					{/if}
				{:else}
					{@render renderChildren(children)}
				{/if}
			</Element>
		{/if}
	{/each}
{/snippet}

{@render renderChildren(tokens)}
