import { expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Streamdown from '../../../../src/lib/Streamdown.svelte';
import { describeInBrowser, testInBrowser } from '../../../helpers/index.js';

describeInBrowser('ported streamdown security escape HTML', () => {
	testInBrowser('escapes raw HTML when renderHtml is disabled', () => {
		const screen = render(Streamdown, {
			content: '<div>Hello</div>',
			static: true,
			renderHtml: false
		});

		expect(screen.container.textContent).toContain('<div>Hello</div>');
		expect(screen.container.innerHTML).toContain('&lt;div&gt;Hello&lt;/div&gt;');
		expect(screen.container.innerHTML).not.toContain('<div>Hello</div>');
	});

	testInBrowser(
		'renders raw HTML through the default security pipeline when renderHtml is enabled',
		() => {
			const screen = render(Streamdown, {
				content: '<div>Hello</div>',
				static: true
			});

			expect(screen.container.textContent).toContain('Hello');
			expect(screen.container.querySelector('div div')).toBeTruthy();
		}
	);
});
