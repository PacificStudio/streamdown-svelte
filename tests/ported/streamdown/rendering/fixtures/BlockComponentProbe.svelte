<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		content,
		index,
		isIncomplete,
		dir,
		children
	}: {
		content: string;
		index: number;
		isIncomplete: boolean;
		dir?: 'ltr' | 'rtl';
		children?: Snippet;
	} = $props();
</script>

<section
	data-block-probe={index}
	data-incomplete={isIncomplete ? 'true' : 'false'}
	data-dir={dir ?? ''}
	data-content={content}
>
	{@render children?.()}
</section>
