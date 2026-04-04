import { expect } from 'vitest';
import { describeInNode, testInNode } from '../../../helpers/index.js';
import { preprocessLiteralTagContent } from '../../../../src/lib/security/preprocess-literal-tag-content.js';

describeInNode('ported streamdown security literal tag preprocessing', () => {
	testInNode('matches the frozen literal-tag preprocessing contract', () => {
		expect(preprocessLiteralTagContent('<mention>_hello_</mention>', [])).toBe(
			'<mention>_hello_</mention>'
		);
		expect(
			preprocessLiteralTagContent('<mention user_id=\"123\">_some_username_</mention>', ['mention'])
		).toBe('<mention user_id=\"123\">\\_some\\_username\\_</mention>');
		expect(preprocessLiteralTagContent('<tag>**bold** text</tag>', ['tag'])).toContain(
			'\\*\\*bold\\*\\*'
		);
		expect(preprocessLiteralTagContent('<tag>`inline code`</tag>', ['tag'])).toContain(
			'\\`inline code\\`'
		);
		expect(
			preprocessLiteralTagContent('_outside_ <mention>_inside_</mention> _also_outside_', [
				'mention'
			])
		).toContain('\\_inside\\_');
		expect(preprocessLiteralTagContent('<foo>_a_</foo> <bar>*b*</bar>', ['foo', 'bar'])).toContain(
			'\\_a\\_'
		);
		expect(preprocessLiteralTagContent('<Mention>_hello_</Mention>', ['mention'])).toBe(
			'<Mention>\\_hello\\_</Mention>'
		);
		expect(preprocessLiteralTagContent('<other>_hello_</other>', ['mention'])).toBe(
			'<other>_hello_</other>'
		);
		expect(preprocessLiteralTagContent('<mention>hello world</mention>', ['mention'])).toBe(
			'<mention>hello world</mention>'
		);
		expect(
			preprocessLiteralTagContent('<ai-thinking>first part\n\nsecond part</ai-thinking>', [
				'ai-thinking'
			])
		).toBe('<ai-thinking>first part&#10;&#10;second part</ai-thinking>');
		expect(preprocessLiteralTagContent('<tag>a\n\nb\n\nc</tag>', ['tag'])).toBe(
			'<tag>a&#10;&#10;b&#10;&#10;c</tag>'
		);
		expect(preprocessLiteralTagContent('<tag>line1\nline2</tag>', ['tag'])).toBe(
			'<tag>line1\nline2</tag>'
		);
	});
});
