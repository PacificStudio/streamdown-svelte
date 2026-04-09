import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildLocalParserIr, buildReferenceParserIr } from './parser-ir.js';
import { listFixturePaths, loadFixtureText } from '../helpers/fixtures.js';
import { parityFixtureIds, parityFixturePaths } from '../../fixtures/parity/fixture-registry.js';

const parityFixtureModules = import.meta.glob('../../fixtures/parity/**/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const parityFixtures = parityFixtureIds.map((id) => {
	const relativePath = parityFixturePaths[id];
	const modulePath = `../../fixtures/parity/${relativePath}`;
	const markdown = parityFixtureModules[modulePath];

	if (typeof markdown !== 'string') {
		throw new Error(`Missing parity fixture module: ${modulePath}`);
	}

	return {
		id,
		path: relativePath,
		markdown
	};
});

const parserParityExcludedFixtureRationales = {
	'16-html-entities-and-cjk.md':
		'Parser IR parity does not yet run the reference CJK plugin pipeline, while the local lexer always enables CJK boundary and delimiter extensions.',
	'17-math-rendering.md':
		'Parser IR parity does not yet run the reference math plugin pipeline, while the local lexer always enables math tokenization.'
} as const satisfies Record<string, string>;

const parserParityFixtureIds = [
	'01-headings-and-inline.md',
	'02-ordered-task-list.md',
	'03-gfm-table.md',
	'04-blockquote.md',
	'05-unordered-list.md',
	'06-code-fence.md',
	'07-heading-and-emphasis.md',
	'08-blockquote-plain.md',
	'09-paragraphs.md',
	'15-composite-playground.md',
	'10-code-actions.md',
	'11-table-actions.md',
	'12-mermaid-actions.md',
	'13-blocked-link-and-image.md',
	'14-footnote-interaction.md'
] as const;

const parserParityFixtures = parityFixtures.filter((fixture) =>
	parserParityFixtureIds.includes(fixture.id as (typeof parserParityFixtureIds)[number])
);

const parserParityLocalFixturePaths = [
	'cjk-commentary.md',
	'ported/remend/streaming/expected.md',
	'ported/remend/streaming/input.md',
	'ported/streamdown/basic-render/input.md'
] as const;

const parserParityLocalFixtures = parserParityLocalFixturePaths.map((path) => ({
	path: `tests/fixtures/${path}`,
	loadMarkdown: () => loadFixtureText(path)
}));

const parserParityInlineFixtures = [
	{
		path: 'inline/dollar-amounts.md',
		markdown: 'The price is $50 and the discount is $10 off.'
	},
	{
		path: 'inline/single-dollar-inline-math-disabled.md',
		markdown: 'This $x = y$ should stay as plain text when single-dollar math is disabled.'
	},
	{
		path: 'inline/code-fence-with-shell-pid.md',
		markdown: '```bash\n# Process tree\npstree -p $$\necho $$\n```\n\nSome text after.'
	},
	{
		path: 'inline/nested-details-block.md',
		markdown: `Text before

<details>
<summary>Outer</summary>

<details>
<summary>Inner</summary>

Inner content

</details>

Outer content after inner closes

</details>

Text after`
	},
	{
		path: 'inline/triple-nested-details-block.md',
		markdown: `<details>
<summary>L1</summary>

<details>
<summary>L2</summary>

<details>
<summary>L3</summary>

Deep content

</details>

</details>

</details>`
	}
] as const;

describe('parser parity fixtures', () => {
	test('covers every shared parity fixture except documented parser-IR exclusions', () => {
		const sharedParityFixtureIds = parityFixtures.map((fixture) => fixture.id);
		const excludedFixturePaths = Object.keys(parserParityExcludedFixtureRationales).sort();

		expect(sharedParityFixtureIds).toEqual(parityFixtureIds);
		expect(sharedParityFixtureIds).toEqual([
			'01-headings-and-inline.md',
			'02-ordered-task-list.md',
			'03-gfm-table.md',
			'04-blockquote.md',
			'05-unordered-list.md',
			'06-code-fence.md',
			'07-heading-and-emphasis.md',
			'08-blockquote-plain.md',
			'09-paragraphs.md',
			'15-composite-playground.md',
			'16-html-entities-and-cjk.md',
			'17-math-rendering.md',
			'10-code-actions.md',
			'11-table-actions.md',
			'12-mermaid-actions.md',
			'13-blocked-link-and-image.md',
			'14-footnote-interaction.md'
		]);
		expect(excludedFixturePaths).toEqual(['16-html-entities-and-cjk.md', '17-math-rendering.md']);
		expect(parserParityFixtures.map((fixture) => fixture.id)).toEqual(parserParityFixtureIds);
		expect(parserParityFixtureIds).toEqual(
			sharedParityFixtureIds.filter((id) => !(id in parserParityExcludedFixtureRationales))
		);
	});

	test('covers every local markdown test fixture with parser IR parity', () => {
		const localMarkdownFixturePaths = listFixturePaths('local').filter((path) =>
			path.endsWith('.md')
		);

		expect(localMarkdownFixturePaths).toEqual([
			'cjk-commentary.md',
			'ported/remend/streaming/expected.md',
			'ported/remend/streaming/input.md',
			'ported/streamdown/basic-render/input.md'
		]);
		expect(parserParityLocalFixturePaths).toEqual(localMarkdownFixturePaths);
	});

	for (const fixture of parserParityFixtures) {
		test(`matches normalized parser IR for shared fixture ${fixture.id}`, async () => {
			expect(buildLocalParserIr(fixture.markdown)).toEqual(
				await buildReferenceParserIr(fixture.markdown)
			);
		});
	}

	for (const fixture of parserParityLocalFixtures) {
		test(`matches normalized parser IR for local fixture ${fixture.path}`, async () => {
			const markdown = await fixture.loadMarkdown();

			expect(buildLocalParserIr(markdown)).toEqual(await buildReferenceParserIr(markdown));
		});
	}

	for (const fixture of parserParityInlineFixtures) {
		test(`matches normalized parser IR for inline fixture ${fixture.path}`, async () => {
			expect(buildLocalParserIr(fixture.markdown)).toEqual(
				await buildReferenceParserIr(fixture.markdown)
			);
		});
	}

	test('documents the current parser-IR exclusions with concrete fixture content', () => {
		const cjkFixture = readFileSync(
			resolve('fixtures/parity/markdown/16-html-entities-and-cjk.md'),
			'utf8'
		);
		const mathFixture = readFileSync(
			resolve('fixtures/parity/markdown/17-math-rendering.md'),
			'utf8'
		);

		expect(cjkFixture).toContain('请访问 https://example.com。谢谢');
		expect(cjkFixture).toContain('**この文は太字になります（括弧付き）。**続き');
		expect(mathFixture).toContain('Inline $E = mc^2$ keeps the inline KaTeX path active.');
		expect(mathFixture).toContain('$$');
	});
});
