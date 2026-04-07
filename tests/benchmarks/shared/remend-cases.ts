// @ts-nocheck
export type BenchmarkCase = {
	group: string;
	name: string;
	input: string;
	compare?: boolean;
};

const shortText = 'This is **bold text';
const mediumText =
	'# Heading\n\nThis is **bold** and *italic* text with `code` and ~~strikethrough~~';
const longText = `
# Complex Document

This document contains **bold**, *italic*, and ***bold-italic*** text.
It also has \`inline code\` and ~~strikethrough~~ formatting.

Here's a [link](https://example.com) and an incomplete link [text](

## Math Support

Inline math: $E = mc^2$ and block math:

$$
\\int_0^\\infty x^2 dx
`;

const incompleteCodeBlock = '```javascript\nconst x = 1;\n';
const completeCodeBlock = '```javascript\nconst x = 1;\n```';
const multipleCodeBlocks = `
\`\`\`javascript
const x = 1;
\`\`\`

Some text

\`\`\`python
y = 2
`;

const streamingSteps = [
	'**',
	'**B',
	'**Bo',
	'**Bol',
	'**Bold',
	'**Bold ',
	'**Bold t',
	'**Bold te',
	'**Bold tex',
	'**Bold text'
] as const;

const largeDoc = `
# Large Document Benchmark

${'## Section\n\nThis is a paragraph with **bold**, *italic*, and `code` formatting.\n\n'.repeat(50)}

## Code Section

\`\`\`javascript
${'const x = 1;\n'.repeat(100)}\`\`\`

## More Content

${'Regular paragraph text with some [links](https://example.com) and more content.\n\n'.repeat(50)}
`;

export const remendBenchmarkCases: BenchmarkCase[] = [
	{
		group: 'Basic Formatting',
		name: 'short text with incomplete bold',
		input: shortText,
		compare: true
	},
	{
		group: 'Basic Formatting',
		name: 'medium text with mixed formatting',
		input: mediumText,
		compare: true
	},
	{
		group: 'Basic Formatting',
		name: 'long text with complex formatting',
		input: longText,
		compare: true
	},
	{
		group: 'Incomplete Patterns',
		name: 'incomplete bold (**)',
		input: 'Some text with **incomplete bold'
	},
	{
		group: 'Incomplete Patterns',
		name: 'incomplete italic (*)',
		input: 'Some text with *incomplete italic'
	},
	{
		group: 'Incomplete Patterns',
		name: 'incomplete italic (__)',
		input: 'Some text with __incomplete italic'
	},
	{
		group: 'Incomplete Patterns',
		name: 'incomplete inline code (`)',
		input: 'Some text with `incomplete code'
	},
	{
		group: 'Incomplete Patterns',
		name: 'incomplete strikethrough (~~)',
		input: 'Some text with ~~incomplete strikethrough'
	},
	{
		group: 'Incomplete Patterns',
		name: 'incomplete bold-italic (***)',
		input: 'Some text with ***incomplete bold-italic'
	},
	{
		group: 'Incomplete Patterns',
		name: 'incomplete link',
		input: 'Some text with [incomplete link]('
	},
	{
		group: 'Incomplete Patterns',
		name: 'incomplete link text',
		input: 'Some text with [incomplete'
	},
	{ group: 'Incomplete Patterns', name: 'incomplete block math ($$)', input: '$$\nE = mc^2\n' },
	{
		group: 'Code Blocks',
		name: 'incomplete code block',
		input: incompleteCodeBlock,
		compare: true
	},
	{ group: 'Code Blocks', name: 'complete code block', input: completeCodeBlock },
	{
		group: 'Code Blocks',
		name: 'multiple code blocks (one incomplete)',
		input: multipleCodeBlocks,
		compare: true
	},
	{
		group: 'Streaming Simulation',
		name: 'streaming bold text (10 steps)',
		input: streamingSteps.join('\n'),
		compare: true
	},
	{
		group: 'Streaming Simulation',
		name: 'streaming inline code (6 steps)',
		input: ['`', '`c', '`co', '`cod', '`code', '`code`'].join('\n')
	},
	{ group: 'Edge Cases', name: 'empty string', input: '' },
	{
		group: 'Edge Cases',
		name: 'plain text (no markdown)',
		input: 'This is plain text without any markdown formatting.',
		compare: true
	},
	{ group: 'Edge Cases', name: 'text with many asterisks', input: '****************************' },
	{ group: 'Edge Cases', name: 'text with mixed emphasis markers', input: '**_*~`**_*~`**_*~`' },
	{ group: 'Edge Cases', name: 'list with emphasis', input: '- **bold\n- *italic\n- `code' },
	{ group: 'Edge Cases', name: 'text with underscores in math', input: '$x_1 + x_2 = x_' },
	{
		group: 'Large Documents',
		name: 'large document (realistic size)',
		input: largeDoc,
		compare: true
	},
	{
		group: 'Large Documents',
		name: 'very large document (2x realistic)',
		input: largeDoc + largeDoc,
		compare: true
	}
];
