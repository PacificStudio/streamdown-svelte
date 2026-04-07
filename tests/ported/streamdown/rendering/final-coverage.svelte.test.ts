import { expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Streamdown from '../../../../src/lib/Streamdown.svelte';
import Mermaid from '../../../../src/lib/Elements/Mermaid.svelte';
import { describeInBrowser, testInBrowser } from '../../../helpers/index.js';
import { createStubMermaidPlugin } from '../../../helpers/mermaid-plugin.js';

describeInBrowser('ported streamdown final-coverage regressions', () => {
	testInBrowser(
		'keeps mermaid controls enabled when the mermaid key is omitted or explicitly undefined',
		async () => {
			const initializeMock = vi.fn();
			const renderMock = vi.fn().mockResolvedValue({
				svg: '<svg width="120" height="80"><text>Coverage Diagram</text></svg>'
			});
			const mermaidPlugin = createStubMermaidPlugin({
				initialize: initializeMock,
				render: renderMock
			});

			const content = ['```mermaid', 'graph TD; A-->B', '```'].join('\n');
			const omitted = render(Streamdown, {
				content,
				plugins: {
					mermaid: mermaidPlugin.plugin
				},
				components: {
					mermaid: Mermaid
				},
				controls: {}
			});
			const explicitUndefined = render(Streamdown, {
				content,
				plugins: {
					mermaid: mermaidPlugin.plugin
				},
				components: {
					mermaid: Mermaid
				},
				controls: {
					mermaid: undefined
				}
			});

			await vi.waitFor(() => {
				expect(omitted.container.querySelector('button[title="Download diagram"]')).toBeTruthy();
				expect(
					explicitUndefined.container.querySelector('button[title="Download diagram"]')
				).toBeTruthy();
			});

			expect(omitted.container.querySelector('button[title="View fullscreen"]')).toBeTruthy();
			expect(
				explicitUndefined.container.querySelector('button[title="View fullscreen"]')
			).toBeTruthy();
			expect(omitted.container.querySelector('button[title="Zoom in"]')).toBeNull();
			expect(explicitUndefined.container.querySelector('button[title="Zoom in"]')).toBeNull();
			expect(omitted.container.querySelector('button[title="Reset zoom and pan"]')).toBeNull();
			expect(explicitUndefined.container.querySelector('button[title="Reset zoom and pan"]')).toBeNull();
		}
	);

	testInBrowser(
		'strips skipped HTML while still honoring urlTransform for rendered markdown urls',
		() => {
			const stripped = render(Streamdown, {
				content: 'Before\n\n<b>bold text</b>\n\nAfter',
				skipHtml: true,
				static: true
			});

			expect(stripped.container.innerHTML).not.toContain('<b>');
			expect(stripped.container.textContent).toContain('Before');
			expect(stripped.container.textContent).toContain('After');

			const transformed = render(Streamdown, {
				content: '![alt](https://example.com/image.png)',
				static: true,
				urlTransform: (url: string) => `${url}?proxied=1`
			});

			const image = transformed.container.querySelector('img');
			expect(image).toBeTruthy();
			expect(image?.getAttribute('src')).toContain('?proxied=1');
		}
	);
});
