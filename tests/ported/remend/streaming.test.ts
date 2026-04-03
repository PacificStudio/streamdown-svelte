import { expect } from 'vitest';
import {
	describeInNode,
	getFirstTokenByType,
	getInlineTokens,
	loadFixturePair,
	parseIncompleteMarkdownText,
	testInNode
} from '../../helpers/index.js';

describeInNode('ported remend streaming helpers', () => {
	testInNode('closes incomplete inline code from fixture data', () => {
		const { input, expected } = loadFixturePair(
			'ported/remend/streaming/input.md',
			'ported/remend/streaming/expected.md'
		);

		expect(parseIncompleteMarkdownText(input)).toBe(expected);
	});

	testInNode('extracts inline tokens for future streamdown ports', () => {
		const tokens = getInlineTokens('Paragraph with [fixture link](https://example.com).');
		const link = getFirstTokenByType(tokens, 'link');

		expect(link).toBeDefined();
		expect(link?.href).toBe('https://example.com');
		expect(link?.text).toBe('fixture link');
	});
});
