<script lang="ts" generics="Source extends Record<string, any> = Record<string, any>">
	import Block from './Block.svelte';
	import { StreamdownContext, type StreamdownProps } from './context.svelte.js';
	import { mergeTheme, shadcnTheme } from './theme.js';
	import { lex, parseBlocks, type StreamdownToken } from './marked/index.js';
	import { mergeTranslations } from './translations.js';
	import { parseIncompleteMarkdown as completeIncompleteMarkdown } from './utils/parse-incomplete-markdown.js';
	import Footnotes from './Elements/Footnotes.svelte';
	import type { Footnote } from './marked/marked-footnotes.js';

	let {
		content = '',
		class: className,
		shikiTheme,
		shikiLanguages,
		shikiThemes,
		parseIncompleteMarkdown,
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
		element = $bindable(),
		icons,
		children,
		extensions,
		sources,
		inlineCitationsMode = 'carousel',
		mdxComponents,
		components,
		static: isStatic,
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

	streamdown = new StreamdownContext({
		get element() {
			return element;
		},
		get content() {
			return content;
		},
		get parseIncompleteMarkdown() {
			return parseIncompleteMarkdown;
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
		get animation() {
			if (!animation?.enabled)
				return {
					enabled: false
				};
			return {
				enabled: true,
				animateOnMount: animation.animateOnMount ?? false,
				type: animation.type || 'blur',
				duration: animation.duration || 500,
				timingFunction: animation.timingFunction || 'ease-in',
				tokenize: animation.tokenize || 'word'
			};
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

	type ParsedBlock = {
		raw: string;
		tokens: StreamdownToken[];
	};

	const parsedBlocks = $derived.by(() => {
		streamdown.footnotes.refs.clear();
		streamdown.footnotes.footnotes.clear();

		const rawBlocks = isStatic ? [content] : parseBlocks(content, streamdown.extensions);

		return rawBlocks.map((raw) => ({
			raw,
			tokens: lex(isStatic ? raw : completeIncompleteMarkdown(raw.trim()), streamdown.extensions)
		})) satisfies ParsedBlock[];
	});

	const footnoteEntries = $derived.by(() => {
		parsedBlocks;
		return Array.from(streamdown.footnotes.footnotes.values()).map((entry) => ({
			...entry,
			lines: [...entry.lines],
			tokens: [...entry.tokens]
		})) satisfies Footnote[];
	});
</script>

<div bind:this={element} class={className}>
	{#each parsedBlocks as parsedBlock, index (`${id}-block-${index}`)}
		<Block static={isStatic} block={parsedBlock.raw} tokens={parsedBlock.tokens} />
	{/each}
	<Footnotes entries={footnoteEntries} />
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
	}
</style>
