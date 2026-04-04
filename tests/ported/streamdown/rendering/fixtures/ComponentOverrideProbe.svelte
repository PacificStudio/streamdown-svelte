<script lang="ts">
	import type { Snippet } from 'svelte';

	type TokenLike = {
		type: string;
		depth?: number;
		ordered?: boolean;
	};

	let {
		token,
		children,
		href,
		target,
		rel,
		title,
		src,
		alt,
		class: className,
		style
	}: {
		token: TokenLike;
		children?: Snippet;
		href?: string;
		target?: string;
		rel?: string;
		title?: string;
		src?: string;
		alt?: string;
		class?: string;
		style?: string;
	} = $props();

	const headingTag = $derived(`h${token.depth ?? 1}`);
</script>

{#if token.type === 'heading'}
	<svelte:element this={headingTag} data-override={headingTag} class={className} {style}>
		{@render children?.()}
	</svelte:element>
{:else if token.type === 'paragraph'}
	<p data-override="p" class={className} {style}>
		{@render children?.()}
	</p>
{:else if token.type === 'blockquote'}
	<blockquote data-override="blockquote" class={className} {style}>
		{@render children?.()}
	</blockquote>
{:else if token.type === 'link'}
	<a data-override="a" {href} {target} {rel} {title} class={className} {style}>
		{@render children?.()}
	</a>
{:else if token.type === 'image'}
	<img data-override="img" {src} {alt} class={className} {style} />
{:else if token.type === 'list'}
	<svelte:element
		this={token.ordered ? 'ol' : 'ul'}
		data-override={token.ordered ? 'ol' : 'ul'}
		class={className}
		{style}
	>
		{@render children?.()}
	</svelte:element>
{:else if token.type === 'list_item'}
	<li data-override="li" class={className} {style}>
		{@render children?.()}
	</li>
{:else if token.type === 'table'}
	<table data-override="table" class={className} {style}>
		{@render children?.()}
	</table>
{:else if token.type === 'thead'}
	<thead data-override="thead" class={className} {style}>
		{@render children?.()}
	</thead>
{:else if token.type === 'tbody'}
	<tbody data-override="tbody" class={className} {style}>
		{@render children?.()}
	</tbody>
{:else if token.type === 'tr'}
	<tr data-override="tr" class={className} {style}>
		{@render children?.()}
	</tr>
{:else if token.type === 'th'}
	<th data-override="th" class={className} {style}>
		{@render children?.()}
	</th>
{:else if token.type === 'td'}
	<td data-override="td" class={className} {style}>
		{@render children?.()}
	</td>
{:else if token.type === 'codespan'}
	<code data-override="inlineCode" class={className} {style}>
		{@render children?.()}
	</code>
{:else if token.type === 'strong'}
	<strong data-override="strong" class={className} {style}>
		{@render children?.()}
	</strong>
{:else if token.type === 'em'}
	<em data-override="em" class={className} {style}>
		{@render children?.()}
	</em>
{:else if token.type === 'del'}
	<del data-override="del" class={className} {style}>
		{@render children?.()}
	</del>
{:else if token.type === 'sub'}
	<sub data-override="sub" class={className} {style}>
		{@render children?.()}
	</sub>
{:else if token.type === 'sup'}
	<sup data-override="sup" class={className} {style}>
		{@render children?.()}
	</sup>
{:else if token.type === 'hr'}
	<hr data-override="hr" class={className} {style} />
{:else if token.type === 'br'}
	<br data-override="br" />
{/if}
