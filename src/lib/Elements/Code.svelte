<script lang="ts">
	import { useStreamdown } from '$lib/context.svelte.js';
	import { save } from '$lib/utils/save.js';
	import { useCopy } from '$lib/utils/copy.svelte.js';
	import { HighlighterManager, languageExtensionMap } from '$lib/utils/hightlighter.svelte.js';
	import { parseCodeFenceInfo } from '$lib/utils/code-block.js';
	import { bundledLanguagesInfo } from '$lib/utils/bundledLanguages.js';
	import type { Tokens } from 'marked';
	import { type ThemedToken } from 'shiki';
	import { getContext, untrack } from 'svelte';
	import { checkIcon, copyIcon, downloadIcon } from './icons.js';

	const {
		token,
		id
	}: {
		token: Tokens.Code;
		id: string;
	} = $props();

	const streamdown = useStreamdown();
	const block = getContext<{ isIncompleteCodeFence: boolean }>('STREAMDOWN_BLOCK');
	const highlighter = HighlighterManager.create(
		bundledLanguagesInfo,
		streamdown.shikiThemes,
		streamdown.shikiLanguages
	);
	const fence = $derived(parseCodeFenceInfo(token.lang));
	const language = $derived(fence.language);
	const showLineNumbers = $derived(streamdown.lineNumbers && fence.showLineNumbers);
	const buttonDisabled = $derived(streamdown.isAnimating || block?.isIncompleteCodeFence);
	const showCodeActions = $derived(
		streamdown.controls.code && (streamdown.codeControls.copy || streamdown.codeControls.download)
	);
	const codeStyle = $derived(
		showLineNumbers && fence.startLine && fence.startLine > 1
			? `counter-reset: line ${fence.startLine - 1};`
			: undefined
	);

	const copy = useCopy({
		get content() {
			return token.text;
		}
	});

	// Download button functionality

	const downloadCode = () => {
		if (buttonDisabled) {
			return;
		}

		try {
			const extension =
				language && language in languageExtensionMap
					? languageExtensionMap[language as keyof typeof languageExtensionMap]
					: 'txt';
			const filename = `file.${extension}`;
			const mimeType = 'text/plain';
			save(filename, token.text, mimeType);
		} catch (error) {
			console.error('Failed to download file:', error);
		}
	};

	$effect(() => {
		const theme = streamdown.shikiTheme;
		const lang = language;
		untrack(() => {
			void highlighter.load(theme, lang);
		});
	});
</script>

<div
	data-streamdown="code-block"
	data-language={language}
	data-incomplete={block?.isIncompleteCodeFence ? 'true' : undefined}
	data-streamdown-code={id}
	style={streamdown.isMounted ? streamdown.animationBlockStyle : ''}
	class={streamdown.theme.code.base}
>
	<div data-streamdown="code-block-header" class={streamdown.theme.code.header}>
		<span class={streamdown.theme.code.language}>{language}</span>
		{#if showCodeActions}
			<div data-streamdown="code-block-actions" class={streamdown.theme.code.buttons}>
				{#if streamdown.codeControls.download}
					<button
						class={streamdown.theme.components.button}
						onclick={downloadCode}
						title={streamdown.translations.downloadFile}
						aria-label={streamdown.translations.downloadFile}
						disabled={buttonDisabled}
						type="button"
					>
						{@render (streamdown.icons?.download || downloadIcon)()}
					</button>
				{/if}

				{#if streamdown.codeControls.copy}
					<button
						class={streamdown.theme.components.button}
						onclick={() => {
							if (!buttonDisabled) {
								void copy.copy();
							}
						}}
						title={streamdown.translations.copyCode}
						aria-label={streamdown.translations.copyCode}
						disabled={buttonDisabled}
						type="button"
					>
						{#if copy.isCopied}
							{@render (streamdown.icons?.check || checkIcon)()}
						{:else}
							{@render (streamdown.icons?.copy || copyIcon)()}
						{/if}
					</button>
				{/if}
			</div>
		{/if}
	</div>
	<div
		data-streamdown="code-block-body"
		style="height: fit-content; width: 100%;"
		class={streamdown.theme.code.container}
	>
		{#if highlighter.isReady(streamdown.shikiTheme, language)}
			<pre class={streamdown.theme.code.pre}><code
					class={showLineNumbers ? '[counter-increment:line_0] [counter-reset:line]' : undefined}
					style={codeStyle}
					>{@render Tokens(
						highlighter.highlightCode(token.text, language, streamdown.shikiTheme)
					)}</code
				></pre>
		{:else}
			<pre class={streamdown.theme.code.pre}><code
					class={showLineNumbers ? '[counter-increment:line_0] [counter-reset:line]' : undefined}
					style={codeStyle}
					>{@render Skeleton(token.text.split('\n'))}</code
				></pre>
		{/if}
	</div>
</div>

{#snippet Tokens(lines: ThemedToken[][])}
	{#each lines as tokens}
		<span
			class={`${streamdown.theme.code.line} ${
				showLineNumbers
					? 'before:content-[counter(line)] before:inline-block before:[counter-increment:line] before:w-6 before:mr-4 before:text-[13px] before:text-right before:text-muted-foreground/50 before:font-mono before:select-none'
					: ''
			}`}
		>
			{#each tokens as token}
				<span
					style={streamdown.isMounted ? streamdown.animationTextStyle : ''}
					style:color={token.color}
					style:background-color={token.bgColor}
				>
					{token.content}
				</span>
			{/each}
		</span>
	{/each}
{/snippet}

{#snippet Skeleton(lines: string[])}
	{#each lines as line}
		<span
			class={`${streamdown.theme.code.skeleton} ${
				showLineNumbers
					? 'before:content-[counter(line)] before:inline-block before:[counter-increment:line] before:w-6 before:mr-4 before:text-[13px] before:text-right before:text-muted-foreground/50 before:font-mono before:select-none'
					: ''
			}`}
		>
			{line.trim().length > 0 ? line : '\u200B'}
		</span>
	{/each}
{/snippet}
