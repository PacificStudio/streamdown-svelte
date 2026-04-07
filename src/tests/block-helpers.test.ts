import { expect, test } from 'vitest';
import { isSecurityHtmlBlock, renderBlockHtml } from '../lib/block/html.js';
import { renderLeafText } from '../lib/block/text.js';
import type { StreamdownToken } from '../lib/marked/index.js';

test('block html helper detects custom allowed tags without rendering markdown tokens', () => {
	const markdown = 'Before\n<Alert type="info">Hello</Alert>';

	expect(
		isSecurityHtmlBlock(markdown, {
			allowedTags: {
				Alert: ['type']
			}
		})
	).toBe(true);
});

test('block html helper escapes raw html when html rendering is disabled', () => {
	expect(
		renderBlockHtml('<div>Hello</div>', {
			renderHtml: false
		})
	).toBe('&lt;div&gt;Hello&lt;/div&gt;');
});

test('block text helper decodes html entities for plain text tokens only', () => {
	const textToken = {
		type: 'text',
		text: 'Fish &amp; Chips'
	} as StreamdownToken;
	const codespanToken = {
		type: 'codespan',
		text: 'Fish &amp; Chips'
	} as StreamdownToken;

	expect(renderLeafText(textToken)).toBe('Fish & Chips');
	expect(renderLeafText(codespanToken)).toBe('Fish &amp; Chips');
});
