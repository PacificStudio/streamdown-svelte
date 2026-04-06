import { expect } from 'vitest';
import { describeInNode, testInNode } from '../../../helpers/index.js';
import { detectTextDirection } from '../../../../src/lib/detect-direction.js';

describeInNode('ported streamdown detect direction helper', () => {
	testInNode(
		'treats markdown headings, emphasis, and links as transparent when finding rtl text',
		() => {
			expect(detectTextDirection('# **مرحبا** [link](https://example.com)')).toBe('rtl');
		}
	);

	testInNode('falls back to ltr when the first visible letters are latin', () => {
		expect(detectTextDirection('> `const x = 1` English then עברית')).toBe('ltr');
	});

	testInNode('defaults to ltr for punctuation-only content', () => {
		expect(detectTextDirection('--- ... ###')).toBe('ltr');
	});
});
