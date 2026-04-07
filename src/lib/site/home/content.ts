export const heroTitle = 'Streamdown-Svelte';
export const heroDescription =
	'Streamdown-Svelte is a markdown renderer designed for streaming content from AI models. Highly interactive, customizable, and easy to use.';
export const installCommand = 'npm i streamdown-svelte';
export const usageFilePath = 'src/lib/ChatMessage.svelte';

export const demoMarkdown = `# Streamdown-Svelte

Streamdown-Svelte is a **streaming-optimized** Markdown renderer for Svelte. It was designed for AI chat interfaces where content arrives token-by-token, but it works just as well for static content.

Most Markdown renderers re-parse the entire document on every update. Streamdown-Svelte takes a different approach — it splits content into discrete blocks and only re-renders the block that changed. This means your UI stays fast, even when the response is hundreds of lines long.

## Getting started

Install the package from npm, then drop it into your component tree. Pass markdown through the \`content\` prop and Streamdown-Svelte handles the rest.

\`\`\`svelte
import { Streamdown } from "streamdown-svelte";

<Streamdown content={content} animated caret="block" />
\`\`\`

The \`animated\` prop enables a smooth fade-in on new blocks, and \`caret\` renders a blinking cursor at the end of the stream — just like the one you're watching right now.

## Plugin ecosystem

Streamdown-Svelte ships with optional plugins for common use cases. Each one is a separate package, so you only bundle what you need.

| Plugin | Package | Purpose |
| --- | --- | --- |
| Syntax highlighting | \`@streamdown-svelte/code\` | Shiki-powered code blocks |
| Diagrams | \`@streamdown-svelte/mermaid\` | Mermaid diagram rendering |
| Math | \`@streamdown-svelte/math\` | KaTeX math expressions |
| CJK | \`@streamdown-svelte/cjk\` | CJK line-breaking rules |

For example, the quadratic formula renders beautifully: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

## Why Streamdown-Svelte?

There are plenty of Markdown renderers out there, but most of them weren't built for streaming. Here's what makes Streamdown-Svelte different:

- [x] Block-level diffing for *incremental* re-renders
- [x] First-class support for ~~incomplete~~ partial Markdown
- [x] Configurable caret styles and animations
- [ ] World domination

> Streamdown-Svelte is open-source and Apache-2.0 licensed. Contributions are welcome.
`;

export const usageCode = `<script lang="ts">
import { Streamdown } from "streamdown-svelte";
import { code } from "@streamdown-svelte/code";
import { mermaid } from "@streamdown-svelte/mermaid";
import { math } from "@streamdown-svelte/math";
import { cjk } from "@streamdown-svelte/cjk";
import "katex/dist/katex.min.css";

export let content = "";
export let isStreaming = false;
</script>

<Streamdown
  {content}
  plugins={{ code, mermaid, math, cjk }}
  isAnimating={isStreaming}
/>\n`;

export const usageMarkdown = `\`\`\`svelte
${usageCode}
\`\`\``;

export const featureCards = [
	{
		id: 'typography',
		title: 'Typography & GFM',
		description:
			'Built-in <a href="/playground">typography</a> for headings, lists, and code blocks. <a href="/playground">GitHub Flavored Markdown</a> adds tables, task lists, strikethrough, and autolinks.'
	},
	{
		id: 'streaming',
		title: 'Streaming experience',
		description:
			'Built-in <a href="#demo">caret indicators</a> show users content is generating. Unterminated block styling and <a href="#demo">animations</a> make partial Markdown look polished while tokens are still arriving.'
	},
	{
		id: 'code',
		title: 'Interactive code blocks',
		description:
			'<a href="/playground">Shiki-powered</a> syntax highlighting with copy and download controls. Streamdown-Svelte supports language detection, line numbers, and custom renderers for rich fenced blocks.'
	},
	{
		id: 'plugins',
		title: 'Math, diagrams & CJK',
		description:
			'LaTeX math through KaTeX, interactive Mermaid diagrams with fullscreen viewing, and <a href="/playground?fixture=15-composite-playground.md">CJK support</a> for correct ideographic punctuation.'
	},
	{
		id: 'security',
		title: 'Security & link safety',
		description:
			'Security hardening blocks images and links from unexpected origins. URL policy, safe HTML handling, and controlled embeds keep streamed content predictable.'
	},
	{
		id: 'customization',
		title: 'Fully customizable',
		description:
			'Override any element with custom Svelte components, apply your own styles, and fine-tune behavior through plugins and configuration without forking the renderer.'
	}
] as const;

export const benchmarkSummary = {
	title: 'Performance',
	description:
		'Current workspace benchmark snapshot against the upstream Streamdown reference. These figures come from the same compare report previewed in the README.',
	chart: '/benchmarks/compare-by-scenario.svg',
	reportDate: 'April 7, 2026',
	platform: 'Linux x64, Intel Core Ultra 9 285K, Node 22.22.1',
	highlights: [
		{
			label: 'Overall throughput',
			value: '+31.8%',
			detail: 'Geometric mean across 31 benchmark pairs'
		},
		{
			label: 'Head-to-head wins',
			value: '19 / 31',
			detail: 'Local Streamdown-Svelte wins over upstream reference'
		},
		{
			label: 'Stream render suite',
			value: '+273.3%',
			detail: 'Fastest area, with 5 out of 5 wins'
		}
	],
	suites: [
		{
			name: 'Stream Render',
			delta: '+273.3%',
			record: '5 wins / 0 losses'
		},
		{
			name: 'Table Utilities',
			delta: '+34.9%',
			record: '9 wins / 0 losses'
		},
		{
			name: 'Remend Parser',
			delta: '-3.3%',
			record: '4 wins / 5 losses'
		},
		{
			name: 'Parse Blocks',
			delta: '-5.1%',
			record: '1 win / 7 losses'
		}
	]
} as const;
