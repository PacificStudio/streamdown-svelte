import { expect } from 'vitest';
import { describeInNode, parseIncompleteMarkdownText, testInNode } from '../../helpers/index.js';

describeInNode('ported remend coverage gaps', () => {
	testInNode(
		'covers whitespace, emphasis, code-fence, and boundary regressions visible through the parser API',
		() => {
			expect(parseIncompleteMarkdownText(' ')).toBe('');
			expect(parseIncompleteMarkdownText('__content_')).toBe('__content__');
			expect(parseIncompleteMarkdownText('_text**')).toBe('_text**_');
			// Local fenced-code recovery keeps the repo's existing auto-close behavior.
			expect(parseIncompleteMarkdownText('```\n***bold')).toBe('```\n***bold\n```');
			expect(parseIncompleteMarkdownText('```\n***\n```\n***text')).toBe(
				'```\n***\n```\n***text***'
			);
			expect(parseIncompleteMarkdownText('```\n_code\n```\n_text')).toBe('```\n_code\n```\n_text_');
			expect(parseIncompleteMarkdownText('\n=')).toBe('\n=');
			expect(parseIncompleteMarkdownText('\n==')).toBe('\n==');
			expect(parseIncompleteMarkdownText('a~~b~~text')).toBe('a~~b~~text');
			expect(parseIncompleteMarkdownText('a~~b~~c~')).toBe('a~~b~~c~');
			expect(parseIncompleteMarkdownText('```\n__code\n```\n__text')).toBe(
				'```\n__code\n```\n__text__'
			);
			expect(parseIncompleteMarkdownText('[link](url) _word')).toBe('[link](url) _word_');
			expect(parseIncompleteMarkdownText('func(_arg')).toBe('func(_arg_');
			expect(parseIncompleteMarkdownText('div> _text')).toBe('div> _text_');
			expect(parseIncompleteMarkdownText('3<5 _text')).toBe('3<5 _text_');
			expect(parseIncompleteMarkdownText('<div>\n_text')).toBe('<div>\n_text_');
			expect(parseIncompleteMarkdownText('[link](a_b) _word')).toBe('[link](a_b) _word_');
			expect(parseIncompleteMarkdownText('$$x$y$$z')).toBe('$$x$y$$z');
		}
	);
});
