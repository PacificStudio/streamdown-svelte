<script lang="ts">
	import { detectTextDirection } from './utils/detectDirection.js';
	import { parseIncompleteMarkdown as completeIncompleteMarkdown } from './utils/parse-incomplete-markdown.js';
	import Element from './Elements/Element.svelte';
	import { lex, type StreamdownToken } from './marked/index.js';
	import AnimatedText from './AnimatedText.svelte';
	import { useStreamdown } from './context.svelte.js';
	import { getContext } from 'svelte';

	let {
		block,
		static: isStatic = false
	}: {
		block: string;
		static?: boolean;
	} = $props();

	const streamdown = useStreamdown();
	const markdown = $derived(
		isStatic || streamdown.parseIncompleteMarkdown === false
			? block
			: completeIncompleteMarkdown(block.trim())
	);
	const tokens = $derived(lex(markdown, streamdown.extensions));
	const insidePopover = getContext('POPOVER');
	const dir = $derived.by(() => {
		if (!streamdown.dir) {
			return undefined;
		}

		if (streamdown.dir === 'auto') {
			return detectTextDirection(block);
		}

		return streamdown.dir;
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

{#if dir}
	<div data-streamdown-dir={dir} {dir} style="display: contents;">
		{@render renderChildren(tokens)}
	</div>
{:else}
	{@render renderChildren(tokens)}
{/if}
