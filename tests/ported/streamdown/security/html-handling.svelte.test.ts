import { render } from 'vitest-browser-svelte';
import Streamdown from '../../../../src/lib/Streamdown.svelte';
import { describeInBrowser, testInBrowser } from '../../../helpers/index.js';
import { expect } from 'vitest';

describeInBrowser('ported streamdown security HTML handling', () => {
	testInBrowser.fails('reference default escapes HTML text when raw HTML processing is disabled', () => {
		const screen = render(Streamdown, {
			content: '<div>Hello</div>',
			static: true
		});

		expect(screen.container.textContent).toContain('<div>Hello</div>');
		expect(screen.container.querySelector('details')).toBeNull();
	});

	testInBrowser.fails('reference default renders multiline content inside details blocks', () => {
		const screen = render(Streamdown, {
			content: `<details>
<summary>Summary</summary>

Paragraph inside details.
</details>`,
			static: true
		});

		const details = screen.container.querySelector('details');
		const paragraph = [...screen.container.querySelectorAll('p')].find((element) =>
			element.textContent?.includes('Paragraph inside details.')
		);

		expect(details).toBeTruthy();
		expect(paragraph).toBeTruthy();
		expect(details?.contains(paragraph as Node)).toBe(true);
	});

	testInBrowser.fails('reference default renders safe self-closing img HTML blocks', () => {
		const screen = render(Streamdown, {
			content: `<p>Before image</p>
<img src="https://example.com/image.jpg" alt="Test Image" width="100" height="100">
<p>After image</p>`,
			static: true
		});

		const image = screen.container.querySelector('img');
		const paragraphs = screen.container.querySelectorAll('p');

		expect(image).toBeTruthy();
		expect(image?.getAttribute('src')).toBe('https://example.com/image.jpg');
		expect(image?.getAttribute('alt')).toBe('Test Image');
		expect(image?.getAttribute('width')).toBe('100');
		expect(image?.getAttribute('height')).toBe('100');
		expect(paragraphs).toHaveLength(2);
	});
});
