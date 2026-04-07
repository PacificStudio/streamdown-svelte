import { render } from 'vitest-browser-svelte';
import { expect } from 'vitest';
import Streamdown from '../../../../src/lib/Streamdown.svelte';
import { describeInBrowser, testInBrowser } from '../../../helpers/index.js';

const readRenderedLineNumbers = (container: HTMLElement) => {
	const lines = [
		...container.querySelectorAll<HTMLElement>(
			'[data-streamdown="code-block-body"] code > .sd-code-line'
		)
	];

	return lines.map((line) => {
		const beforeStyle = window.getComputedStyle(line, '::before');
		const rect = line.getBoundingClientRect();
		return {
			content: beforeStyle.content.replaceAll('"', ''),
			position: beforeStyle.position,
			top: rect.top,
			bottom: rect.bottom
		};
	});
};

describeInBrowser('ported streamdown code block features', () => {
	testInBrowser(
		'shows line numbers by default, honors startLine, and strips metastring from the language label',
		async () => {
			const screen = render(Streamdown, {
				content: '```js startLine=5\nconst x = 1;\nconst y = 2;\nconst z = 3;\n```'
			});

			const code = screen.container.querySelector<HTMLElement>('code');
			expect(code?.classList.contains('sd-line-numbers')).toBe(true);
			expect(code?.getAttribute('style')).toContain('counter-reset: sd-line 4');

			const renderedLineNumbers = readRenderedLineNumbers(screen.container);
			expect(renderedLineNumbers.map((line) => line.content)).toStrictEqual([
				'counter(sd-line)',
				'counter(sd-line)',
				'counter(sd-line)'
			]);
			expect(renderedLineNumbers.every((line) => line.position === 'absolute')).toBe(true);
			expect(renderedLineNumbers[0].bottom).toBeLessThanOrEqual(renderedLineNumbers[1].top);
			expect(renderedLineNumbers[1].bottom).toBeLessThanOrEqual(renderedLineNumbers[2].top);

			const header = screen.container.querySelector('[data-streamdown="code-block-header"]');
			expect(header?.textContent?.trim()).toBe('js');
		}
	);

	testInBrowser('hides line numbers when lineNumbers is disabled globally', async () => {
		const screen = render(Streamdown, {
			content: '```js\nconst x = 1;\nconst y = 2;\n```',
			lineNumbers: false
		});

		const code = screen.container.querySelector('code');
		expect(code?.classList.contains('sd-line-numbers')).toBe(false);

		const renderedLineNumbers = readRenderedLineNumbers(screen.container);
		expect(renderedLineNumbers.map((line) => line.content)).toStrictEqual(['none', 'none']);
	});

	testInBrowser('hides line numbers for noLineNumbers fenced-code metadata', async () => {
		const screen = render(Streamdown, {
			content: '```js noLineNumbers\nconst x = 1;\nconst y = 2;\n```',
			lineNumbers: true
		});

		const code = screen.container.querySelector('code');
		expect(code?.classList.contains('sd-line-numbers')).toBe(false);
		expect(readRenderedLineNumbers(screen.container).map((line) => line.content)).toStrictEqual([
			'none',
			'none'
		]);
	});
});
