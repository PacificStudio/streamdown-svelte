import { render } from 'vitest-browser-svelte';
import Streamdown from '../../../../src/lib/Streamdown.svelte';
import { describeInBrowser, testInBrowser } from '../../../helpers/index.js';
import { expect } from 'vitest';

const StreamdownWithFutureProps = Streamdown as unknown as typeof Streamdown & {
	new (...args: any[]): any;
};

describeInBrowser('ported streamdown security allowed tags', () => {
	testInBrowser.fails('reference allowedTags support preserves explicitly allowed custom tags', () => {
		const screen = render(StreamdownWithFutureProps, {
			content: 'Hello <custom>world</custom>',
			static: true,
			allowedTags: {
				custom: []
			}
		});

		const custom = screen.container.querySelector('custom');
		expect(custom).toBeTruthy();
		expect(custom?.textContent).toBe('world');
	});

	testInBrowser.fails('reference allowedTags support keeps allowed attributes and strips blocked ones', () => {
		const screen = render(StreamdownWithFutureProps, {
			content: '<custom allowed="yes" blocked="no">content</custom>',
			static: true,
			allowedTags: {
				custom: ['allowed']
			}
		});

		const custom = screen.container.querySelector('custom');
		expect(custom).toBeTruthy();
		expect(custom?.getAttribute('allowed')).toBe('yes');
		expect(custom?.getAttribute('blocked')).toBeNull();
		expect(custom?.textContent).toBe('content');
	});
});
