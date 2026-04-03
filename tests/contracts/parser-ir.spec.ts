import { describe, expect, test } from 'vitest';
import {
	PARSER_IR_IGNORED_FIELDS,
	PARSER_IR_NORMALIZATION_RULES,
	buildLocalParserIr,
	buildReferenceParserIr
} from './parser-ir.js';

describe('parser IR contract', () => {
	test('documents normalization rules and ignored fields', () => {
		expect(PARSER_IR_NORMALIZATION_RULES.map((rule) => rule.id)).toEqual([
			'incomplete-markdown-prepass',
			'ignore-repaired-markdown-text',
			'block-segmentation-first'
		]);
		expect(PARSER_IR_IGNORED_FIELDS.map((entry) => entry.field)).toEqual([
			'raw',
			'position',
			'text',
			'tokens',
			'listType',
			'value',
			'skipped',
			'thead/tbody/tfoot',
			'rowspan/colspan/complex span metadata'
		]);
	});

	test('projects a representative markdown document from both parsers into the shared IR schema', async () => {
		const markdown =
			'# Heading with *emphasis* and [link](https://example.com)\n\nParagraph with `code`.';

		expect(buildLocalParserIr(markdown)).toEqual(await buildReferenceParserIr(markdown));
	});

	test('marks incomplete markdown repair without comparing repaired source text', async () => {
		const local = buildLocalParserIr('This is **bold');
		const reference = await buildReferenceParserIr('This is **bold');

		expect(local.normalization.incompleteMarkdownRepaired).toBe(true);
		expect(reference.normalization.incompleteMarkdownRepaired).toBe(true);
		expect(local.blocks).toEqual(reference.blocks);
	});
});
