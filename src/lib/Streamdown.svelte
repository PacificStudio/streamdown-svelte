<script lang="ts" generics="Source extends Record<string, any> = Record<string, any>">
	import Block from './Block.svelte';
	import { StreamdownContext, type StreamdownProps } from './context.svelte.js';
	import { mergeTheme, shadcnTheme } from './theme.js';
	import { parseBlocks } from './marked/index.js';
	import { parseIncompleteMarkdown as repairIncompleteMarkdown } from './utils/parse-incomplete-markdown.js';
	import { carets, hasIncompleteCodeFence, hasTable } from './streaming.js';
	import { mergeTranslations } from './translations.js';

	let {
		content = '',
		class: className,
		className: futureClassName,
		shikiTheme,
		shikiLanguages,
		shikiThemes,
		parseIncompleteMarkdown,
		parseMarkdownIntoBlocksFn,
		defaultOrigin,
		allowedLinkPrefixes = ['*'],
		allowedImagePrefixes = ['*'],
		theme,
		mermaidConfig = {},
		katexConfig,
		translations,
		baseTheme,
		mergeTheme: shouldMergeTheme = true,
		streamdown = $bindable(),
		renderHtml,
		controls,
		animation,
		animated,
		isAnimating,
		caret,
		mode,
		onAnimationStart,
		onAnimationEnd,
		element = $bindable(),
		icons,
		children,
		extensions,
		sources,
		inlineCitationsMode = 'carousel',
		mdxComponents,
		components,
		static: staticMode,
		...snippets
	}: StreamdownProps<Source> = $props();
	import { useDarkMode } from '$lib/utils/darkMode.svelte.js';

	const darkMode = useDarkMode();

	const shikiThemedTheme = $derived(
		shikiThemes
			? Object.keys(shikiThemes)[0] || 'github-light'
			: darkMode.current
				? 'github-dark'
				: 'github-light'
	);

	const mermaidThemedTheme = $derived(
		mermaidConfig?.theme ? mermaidConfig.theme : darkMode.current ? 'dark' : 'default'
	);

	const resolvedClassName = $derived(
		[className, futureClassName].filter((value): value is string => Boolean(value)).join(' ')
	);

	const resolvedMode = $derived(mode ?? (staticMode ? 'static' : 'streaming'));
	const resolvedIsAnimating = $derived(isAnimating ?? false);
	const shouldParseIncompleteMarkdown = $derived(parseIncompleteMarkdown ?? true);

	const resolvedAnimation = $derived.by(() => {
		if (resolvedMode === 'static') {
			return { enabled: false } as const;
		}

		if (animated !== undefined) {
			if (!animated || !resolvedIsAnimating) {
				return { enabled: false } as const;
			}

			if (animated === true) {
				return {
					enabled: true,
					animateOnMount: false,
					type: 'fade',
					duration: 150,
					timingFunction: 'ease',
					tokenize: 'word'
				} as const;
			}

			return {
				enabled: true,
				animateOnMount: false,
				type:
					animated.animation === 'blurIn'
						? 'blur'
						: animated.animation === 'slideUp'
							? 'slideUp'
							: 'fade',
				duration: animated.duration ?? 150,
				timingFunction: animated.easing ?? 'ease',
				tokenize: animated.sep ?? 'word'
			} as const;
		}

		if (!animation?.enabled) {
			return { enabled: false } as const;
		}

		return {
			enabled: isAnimating === undefined ? true : resolvedIsAnimating,
			animateOnMount: animation.animateOnMount ?? false,
			type: animation.type || 'blur',
			duration: animation.duration || 500,
			timingFunction: animation.timingFunction || 'ease-in',
			tokenize: animation.tokenize || 'word'
		} as const;
	});

	streamdown = new StreamdownContext({
		get element() {
			return element;
		},
		get content() {
			return content;
		},
		get parseIncompleteMarkdown() {
			return shouldParseIncompleteMarkdown;
		},
		get parseMarkdownIntoBlocksFn() {
			return parseMarkdownIntoBlocksFn;
		},
		get defaultOrigin() {
			return defaultOrigin;
		},
		get allowedLinkPrefixes() {
			return allowedLinkPrefixes;
		},
		get allowedImagePrefixes() {
			return allowedImagePrefixes;
		},
		get shikiTheme() {
			return shikiTheme || shikiThemedTheme;
		},
		get snippets() {
			return snippets;
		},
		get theme() {
			return shouldMergeTheme
				? mergeTheme(theme, baseTheme)
				: theme || (baseTheme === 'shadcn' ? shadcnTheme : theme);
		},
		get baseTheme() {
			return baseTheme;
		},
		get mermaidConfig() {
			return {
				theme: mermaidThemedTheme,
				...mermaidConfig
			};
		},
		get katexConfig() {
			return katexConfig;
		},
		get renderHtml() {
			return renderHtml;
		},
		get translations() {
			return mergeTranslations(translations);
		},
		get shikiLanguages() {
			return shikiLanguages;
		},
		get shikiThemes() {
			return shikiThemes;
		},
		get sources() {
			return sources;
		},
		get inlineCitationsMode() {
			return inlineCitationsMode;
		},
		get isAnimating() {
			return resolvedIsAnimating;
		},
		get mode() {
			return resolvedMode;
		},
		get animation() {
			return resolvedAnimation;
		},
		get controls() {
			const codeControls = controls?.code ?? true;
			const mermaidControls = controls?.mermaid ?? true;
			const tableControls = controls?.table ?? true;
			return {
				code: codeControls,
				mermaid: mermaidControls,
				table: tableControls
			};
		},
		get children() {
			return children;
		},
		get extensions() {
			return extensions;
		},
		get icons() {
			return icons;
		},
		get mdxComponents() {
			return mdxComponents;
		},
		get components() {
			return components;
		}
	});

	const id = $props.id();
	const splitBlocks = $derived(
		parseMarkdownIntoBlocksFn ??
			((markdown: string) => parseBlocks(markdown, streamdown.extensions))
	);

	const rawBlocks = $derived(resolvedMode === 'static' ? [content] : splitBlocks(content));
	const blockIsIncomplete = $derived(
		rawBlocks.map(
			(block, index) =>
				resolvedMode === 'streaming' &&
				resolvedIsAnimating &&
				index === rawBlocks.length - 1 &&
				hasIncompleteCodeFence(block)
		)
	);

	const blocks = $derived.by(() => {
		if (resolvedMode === 'static') {
			return [content];
		}

		return rawBlocks.map((block, index) => {
			if (
				!shouldParseIncompleteMarkdown ||
				(blockIsIncomplete[index] && hasIncompleteCodeFence(block))
			) {
				return block;
			}

			return repairIncompleteMarkdown(block);
		});
	});

	const shouldHideCaret = $derived(
		resolvedMode !== 'streaming' || !caret || !resolvedIsAnimating || rawBlocks.length === 0
			? false
			: (() => {
					const lastBlock = rawBlocks.at(-1) as string;
					return hasIncompleteCodeFence(lastBlock) || hasTable(lastBlock);
				})()
	);

	const wrapperClassName = $derived(
		[
			resolvedClassName,
			caret && resolvedIsAnimating && resolvedMode === 'streaming' && !shouldHideCaret
				? 'streamdown-caret-active'
				: ''
		]
			.filter(Boolean)
			.join(' ')
	);

	const wrapperStyle = $derived(
		caret && resolvedIsAnimating && resolvedMode === 'streaming' && !shouldHideCaret
			? `--streamdown-caret:"${carets[caret]}";`
			: undefined
	);

	let previousIsAnimating = $state<boolean | null>(null);

	$effect(() => {
		if (resolvedMode === 'static') {
			previousIsAnimating = resolvedIsAnimating;
			return;
		}

		const previousValue = previousIsAnimating;
		previousIsAnimating = resolvedIsAnimating;

		if (previousValue === null) {
			if (resolvedIsAnimating) {
				onAnimationStart?.();
			}
			return;
		}

		if (resolvedIsAnimating && !previousValue) {
			onAnimationStart?.();
		} else if (!resolvedIsAnimating && previousValue) {
			onAnimationEnd?.();
		}
	});
</script>

<div bind:this={element} class={wrapperClassName} style={wrapperStyle}>
	{#if resolvedMode === 'static'}
		<Block static={true} block={content} parseIncompleteMarkdown={false} />
	{:else}
		{#if blocks.length === 0 && caret && resolvedIsAnimating && !shouldHideCaret}
			<span data-streamdown-caret-placeholder=""></span>
		{/if}
		{#each blocks as block, index (`${id}-block-${index}`)}
			<Block
				static={false}
				{block}
				parseIncompleteMarkdown={false}
				isIncomplete={blockIsIncomplete[index]}
			/>
		{/each}
	{/if}
</div>

<style global>
	:global {
		@keyframes sd-fade {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}

		@keyframes sd-blur {
			from {
				opacity: 0;
				filter: blur(5px);
			}
			to {
				opacity: 1;
				filter: blur(0px);
			}
		}

		@keyframes sd-slideUp {
			from {
				transform: translateY(10%);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}

		@keyframes sd-slideDown {
			from {
				transform: translateY(-10%);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}

		:global(.streamdown-caret-active > :last-child::after) {
			display: inline;
			vertical-align: baseline;
			content: var(--streamdown-caret);
		}
	}
</style>
