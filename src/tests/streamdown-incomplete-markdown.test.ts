import { expect, test } from 'vitest';
import remend from 'remend';
import {
	createStreamdownIncompleteMarkdownParser,
	repairIncompleteMarkdown
} from '../lib/streamdown/incomplete-markdown.js';

test('default incomplete-markdown repair uses the shared parser path', () => {
	const input = 'Hello **world';

	expect(repairIncompleteMarkdown(input)).toBe(
		createStreamdownIncompleteMarkdownParser().parse(input)
	);
});

test('custom remend options fall back to the configurable remend handler pipeline', () => {
	const input = '[partial link';
	const options = { linkMode: 'text-only' as const };

	expect(repairIncompleteMarkdown(input, options)).toBe(remend(input, options));
});
