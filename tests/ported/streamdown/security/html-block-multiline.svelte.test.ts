import { expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Streamdown from '../../../../src/lib/Streamdown.svelte';
import { describeInBrowser, testInBrowser } from '../../../helpers/index.js';

describeInBrowser('ported streamdown security HTML block multiline', () => {
	testInBrowser('renders multiline content inside details elements', () => {
		const screen = render(Streamdown, {
			content: `<details>
<summary>Summary</summary>

Paragraph inside details.
</details>`,
			static: true
		});

		const details = screen.container.querySelector('details');
		const paragraph = screen.container.querySelector('p');

		expect(details).toBeTruthy();
		expect(paragraph).toBeTruthy();
		expect(details?.contains(paragraph as Node)).toBe(true);
	});

	testInBrowser('renders multiline content inside div elements', () => {
		const screen = render(Streamdown, {
			content: `<div>

Paragraph inside div.
</div>`,
			static: true
		});

		const paragraph = screen.container.querySelector('p');
		expect(paragraph).toBeTruthy();
		expect(paragraph?.closest('div')).toBeTruthy();
	});

	testInBrowser('keeps multiple paragraphs inside details blocks', () => {
		const screen = render(Streamdown, {
			content: `<details>
<summary>Summary</summary>

First paragraph.

Second paragraph.
</details>`,
			static: true
		});

		const details = screen.container.querySelector('details');
		const paragraphs = screen.container.querySelectorAll('p');

		expect(details).toBeTruthy();
		expect(paragraphs.length).toBeGreaterThan(0);
		for (const paragraph of paragraphs) {
			expect(details?.contains(paragraph)).toBe(true);
		}
	});

	testInBrowser('preserves nested HTML block structure', () => {
		const screen = render(Streamdown, {
			content: `<div>
<details>
<summary>Nested Summary</summary>

Content in nested structure.
</details>
</div>`,
			static: true
		});

		const details = screen.container.querySelector('details');
		const paragraph = screen.container.querySelector('p');

		expect(details).toBeTruthy();
		expect(paragraph).toBeTruthy();
		expect(details?.contains(paragraph as Node)).toBe(true);
	});
});
