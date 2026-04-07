import { render } from 'vitest-browser-svelte';
import { expect, vi } from 'vitest';
import Streamdown from '../../../../src/lib/Streamdown.svelte';
import CustomCodeRenderer from '../../../fixtures/plugin-contract/CustomCodeRenderer.svelte';
import {
	createCjkPlugin,
	createMathPlugin,
	type CodeHighlighterPlugin
} from '../../../../src/lib/index.js';
import { describeInBrowser, testInBrowser } from '../../../helpers/index.js';

describeInBrowser('ported streamdown plugin contract', () => {
	testInBrowser('activates the full code component through plugins.code', async () => {
		const codePlugin: CodeHighlighterPlugin = {
			name: 'shiki',
			type: 'code-highlighter',
			getSupportedLanguages: () => ['javascript'],
			getThemes: () => ['github-light', 'github-dark'],
			supportsLanguage: () => true,
			highlight: () => ({
				tokens: [[{ content: 'console.log("plugin")', color: '#005cc5' }]]
			})
		};

		const screen = render(Streamdown, {
			content: ['```javascript', 'console.log("plugin")', '```'].join('\n'),
			plugins: {
				code: codePlugin
			}
		});

		await vi.waitFor(() => {
			expect(screen.container.querySelector('button[title="Copy Code"]')).toBeTruthy();
			expect(screen.container.querySelector('button[title="Download file"]')).toBeTruthy();
			expect(screen.container.textContent).toContain('console.log("plugin")');
		});
	});

	testInBrowser(
		're-resolves plugins.code activeTheme from the streamdown theme contract',
		async () => {
			const highlight = vi.fn(() => ({
				tokens: [[{ content: 'import { Streamdown } from "streamdown-svelte";', color: '#24292e' }]]
			}));
			const codePlugin: CodeHighlighterPlugin = {
				name: 'shiki',
				type: 'code-highlighter',
				getSupportedLanguages: () => ['svelte'],
				getThemes: () => ['github-light', 'github-dark'],
				supportsLanguage: () => true,
				highlight
			};

			document.documentElement.dataset.theme = 'light';

			const screen = render(Streamdown, {
				content: ['```svelte', 'import { Streamdown } from "streamdown-svelte";', '```'].join('\n'),
				plugins: {
					code: codePlugin
				}
			});

			await vi.waitFor(() => {
				expect(screen.container.textContent).toContain(
					'import { Streamdown } from "streamdown-svelte";'
				);
				expect(highlight).toHaveBeenCalledWith(
					expect.objectContaining({
						activeTheme: 'github-light'
					}),
					expect.any(Function)
				);
			});

			document.documentElement.dataset.theme = 'dark';

			await vi.waitFor(() => {
				expect(highlight).toHaveBeenCalledWith(
					expect.objectContaining({
						activeTheme: 'github-dark'
					}),
					expect.any(Function)
				);
			});

			delete document.documentElement.dataset.theme;
		}
	);

	testInBrowser('renders KaTeX output when plugins.math is provided', async () => {
		const screen = render(Streamdown, {
			content: '$$E = mc^2$$',
			plugins: {
				math: createMathPlugin()
			}
		});

		await vi.waitFor(() => {
			expect(screen.container.querySelector('.katex')).toBeTruthy();
		});
	});

	testInBrowser(
		'renders mermaid controls via plugins.mermaid without local component overrides',
		async () => {
			const initialize = vi.fn();
			const renderDiagram = vi.fn(async () => ({
				svg: '<svg width="120" height="80"><text>Graph</text></svg>'
			}));

			const screen = render(Streamdown, {
				content: ['```mermaid', 'graph TD; A-->B', '```'].join('\n'),
				plugins: {
					mermaid: {
						name: 'mermaid',
						type: 'diagram',
						language: 'mermaid',
						getMermaid: () => ({
							initialize,
							render: renderDiagram
						})
					}
				}
			});

			await vi.waitFor(() => {
				expect(screen.container.querySelector('button[title="Download diagram"]')).toBeTruthy();
				expect(screen.container.querySelector('button[title="View fullscreen"]')).toBeTruthy();
				expect(renderDiagram).toHaveBeenCalled();
			});
		}
	);

	testInBrowser(
		'uses plugins.renderers for matching fenced code blocks and forwards meta',
		async () => {
			const screen = render(Streamdown, {
				content: ['```vega-lite {1} title="chart"', '{"mark":"bar"}', '```'].join('\n'),
				plugins: {
					renderers: [
						{
							language: ['vega', 'vega-lite'],
							component: CustomCodeRenderer
						}
					]
				}
			});

			await vi.waitFor(() => {
				const renderer = screen.container.querySelector('[data-testid="custom-renderer"]');
				expect(renderer).toBeTruthy();
				expect(renderer?.getAttribute('data-language')).toBe('vega-lite');
				expect(renderer?.getAttribute('data-code')).toBe('{"mark":"bar"}');
				expect(renderer?.getAttribute('data-meta')).toBe('{1} title="chart"');
			});
		}
	);

	testInBrowser(
		'splits bare autolinks at CJK punctuation when plugins.cjk is enabled',
		async () => {
			const screen = render(Streamdown, {
				content: '请访问 https://example.com。谢谢',
				plugins: {
					cjk: createCjkPlugin()
				},
				linkSafety: {
					enabled: false
				}
			});

			await vi.waitFor(() => {
				const link = screen.container.querySelector('a');
				expect(link).toBeTruthy();
				expect(link?.getAttribute('href')).toBe('https://example.com/');
				expect(screen.container.textContent).toContain('。谢谢');
			});
		}
	);
});
