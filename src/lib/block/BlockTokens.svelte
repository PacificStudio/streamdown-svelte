<script lang="ts">
	import { getContext } from 'svelte';
	import AnimatedText from '../AnimatedText.svelte';
	import { useStreamdown } from '../context.svelte.js';
	import Element from '../Elements/Element.svelte';
	import type { StreamdownToken } from '../marked/index.js';
	import { getTokenChildren, renderLeafText, shouldAnimateLeafText } from './text.js';

	let {
		tokens,
		isIncomplete = false,
		isStatic = false
	}: {
		tokens: StreamdownToken[];
		isIncomplete?: boolean;
		isStatic?: boolean;
	} = $props();

	const streamdown = useStreamdown();
	const insidePopover = Boolean(getContext('POPOVER'));
</script>

{#snippet renderChildren(items: StreamdownToken[])}
	{#each items as token}
		{@const children = getTokenChildren(token)}
		<Element {token} {isIncomplete}>
			{#if children.length === 0}
				{#if shouldAnimateLeafText({
					token,
					animationEnabled: streamdown.animation.enabled,
					insidePopover,
					isStatic
				})}
					<AnimatedText text={renderLeafText(token)} />
				{:else}
					{renderLeafText(token)}
				{/if}
			{:else}
				{@render renderChildren(children)}
			{/if}
		</Element>
	{/each}
{/snippet}

{@render renderChildren(tokens)}
