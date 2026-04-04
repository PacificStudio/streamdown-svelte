import { expect } from 'vitest';
import { describeInNode, parseIncompleteMarkdownText, testInNode } from '../../helpers/index.js';

describeInNode('ported remend edge cases', () => {
	testInNode(
		'matches the frozen remend edge-case bundle on externally visible parser behavior',
		() => {
			expect(parseIncompleteMarkdownText('Text ending with *')).toBe('Text ending with *');
			expect(parseIncompleteMarkdownText('Text ending with **')).toBe('Text ending with **');
			expect(parseIncompleteMarkdownText('****')).toBe('****');
			expect(parseIncompleteMarkdownText('``')).toBe('``');
			expect(parseIncompleteMarkdownText('**')).toBe('**');
			expect(parseIncompleteMarkdownText('__')).toBe('__');
			expect(parseIncompleteMarkdownText('***')).toBe('***');
			expect(parseIncompleteMarkdownText('*')).toBe('*');
			expect(parseIncompleteMarkdownText('_')).toBe('_');
			expect(parseIncompleteMarkdownText('~~')).toBe('~~');
			expect(parseIncompleteMarkdownText('`')).toBe('`');
			expect(parseIncompleteMarkdownText('** __')).toBe('** __');
			expect(parseIncompleteMarkdownText('\n** __\n')).toBe('\n** __\n');
			expect(parseIncompleteMarkdownText('* _ ~~ `')).toBe('* _ ~~ `');
			// Local parser preserves trailing single-space standalone markers.
			expect(parseIncompleteMarkdownText('** ')).toBe('** ');
			expect(parseIncompleteMarkdownText(' **')).toBe(' **');
			expect(parseIncompleteMarkdownText('  **  ')).toBe('  **  ');
			expect(parseIncompleteMarkdownText('**text')).toBe('**text**');
			expect(parseIncompleteMarkdownText('__text')).toBe('__text__');
			expect(parseIncompleteMarkdownText('*text')).toBe('*text*');
			expect(parseIncompleteMarkdownText('_text')).toBe('_text_');
			expect(parseIncompleteMarkdownText('~~text')).toBe('~~text~~');
			expect(parseIncompleteMarkdownText('`text')).toBe('`text`');
			expect(parseIncompleteMarkdownText(`a`.repeat(10_000) + ' **bold')).toBe(
				`${`a`.repeat(10_000)} **bold**`
			);
			expect(parseIncompleteMarkdownText('Text with \\* escaped asterisk')).toBe(
				'Text with \\* escaped asterisk'
			);
			expect(parseIncompleteMarkdownText('text**')).toBe('text**');
			expect(parseIncompleteMarkdownText('text*')).toBe('text*');
			expect(parseIncompleteMarkdownText('text`')).toBe('text`');
			expect(parseIncompleteMarkdownText('text$')).toBe('text$');
			expect(parseIncompleteMarkdownText('text~~')).toBe('text~~');
			expect(parseIncompleteMarkdownText('text **bold')).toBe('text **bold**');
			expect(parseIncompleteMarkdownText('text\n**bold')).toBe('text\n**bold**');
			expect(parseIncompleteMarkdownText('text\t`code')).toBe('text\t`code`');
			expect(parseIncompleteMarkdownText('**emoji 🎉')).toBe('**emoji 🎉**');
			expect(parseIncompleteMarkdownText('`código')).toBe('`código`');
			expect(parseIncompleteMarkdownText('**&lt;tag&gt;')).toBe('**&lt;tag&gt;**');
			expect(parseIncompleteMarkdownText('`&amp;')).toBe('`&amp;`');
			expect(parseIncompleteMarkdownText('3 + 2 - 5 * 0 = ?')).toBe('3 + 2 - 5 * 0 = ?');
			expect(parseIncompleteMarkdownText('5 * 0')).toBe('5 * 0');
			expect(parseIncompleteMarkdownText('x * y')).toBe('x * y');
			expect(parseIncompleteMarkdownText('a * b = c')).toBe('a * b = c');
			expect(parseIncompleteMarkdownText('2 * 3 * 4')).toBe('2 * 3 * 4');
			expect(parseIncompleteMarkdownText('5 * 0 and *italic')).toBe('5 * 0 and *italic*');
		}
	);
});
