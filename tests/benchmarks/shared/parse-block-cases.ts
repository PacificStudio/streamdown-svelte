// @ts-nocheck
import type { BenchmarkCase } from './remend-cases';

const multipleBlocks = `
# Heading 1

This is paragraph 1.

## Heading 2

This is paragraph 2.

- List item 1
- List item 2

> Blockquote text
`;

const manyBlocks = Array.from(
	{ length: 100 },
	(_, index) => `## Section ${index}\n\nParagraph ${index}`
).join('\n\n');

const singleCodeBlock = `
Some text

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`

More text
`;

const multipleCodeBlocks = `
\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`python
y = 2
\`\`\`

\`\`\`rust
let z = 3;
\`\`\`
`;

const largeCodeBlock = `\`\`\`javascript\n${'const x = 1;\n'.repeat(1000)}\`\`\``;

const simpleMath = `
Some text

$$
E = mc^2
$$

More text
`;

const complexMath = `
$$
\\begin{bmatrix}
a & b \\\\
c & d
\\end{bmatrix}
$$

Text

$$
\\int_0^\\infty x^2 dx
$$
`;

const mathWithSplitDelimiters = `
Some text

$$

x^2 + y^2 = z^2

$$

More text
`;

const simpleHtml = `
<div>
  <p>HTML content</p>
</div>
`;

const nestedHtml = `
<div>
  <div>
    <div>
      <p>Nested content</p>
    </div>
  </div>
</div>
`;

const multipleHtmlBlocks = `
<div>First block</div>

Some markdown

<section>
  <p>Second block</p>
</section>

More markdown
`;

export const parseBlockBenchmarkCases: BenchmarkCase[] = [
	{
		group: 'Basic Parsing',
		name: 'single block',
		input: '# Heading\n\nThis is a paragraph.',
		compare: true
	},
	{ group: 'Basic Parsing', name: 'multiple blocks (10)', input: multipleBlocks, compare: true },
	{ group: 'Basic Parsing', name: 'many blocks (100)', input: manyBlocks, compare: true },
	{ group: 'Code Blocks', name: 'single code block', input: singleCodeBlock },
	{ group: 'Code Blocks', name: 'multiple code blocks', input: multipleCodeBlocks, compare: true },
	{
		group: 'Code Blocks',
		name: 'large code block (1000 lines)',
		input: largeCodeBlock,
		compare: true
	},
	{ group: 'Math Blocks', name: 'simple math block', input: simpleMath },
	{ group: 'Math Blocks', name: 'complex math blocks', input: complexMath, compare: true },
	{ group: 'Math Blocks', name: 'math with split delimiters', input: mathWithSplitDelimiters },
	{ group: 'HTML Blocks', name: 'simple HTML block', input: simpleHtml },
	{ group: 'HTML Blocks', name: 'nested HTML block', input: nestedHtml, compare: true },
	{ group: 'HTML Blocks', name: 'multiple HTML blocks', input: multipleHtmlBlocks, compare: true }
];
