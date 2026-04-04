import { expect } from 'vitest';
import { describeInNode, testInNode } from '../../../helpers/index.js';
import { preprocessCustomTags } from '../../../../src/lib/security/preprocess-custom-tags.js';

describeInNode('ported streamdown security preprocess custom tags', () => {
	testInNode('matches the frozen custom-tag preprocessing contract', () => {
		expect(preprocessCustomTags('<custom>\n\nContent\n\n</custom>', [])).toBe(
			'<custom>\n\nContent\n\n</custom>'
		);
		expect(preprocessCustomTags('<custom>\nHello\n\nWorld\n</custom>', ['custom'])).toBe(
			'<custom>\nHello\n<!---->\nWorld\n</custom>\n\n'
		);
		expect(preprocessCustomTags('<custom>Hello\n\nWorld</custom>', ['custom'])).toBe(
			'<custom>\nHello\n<!---->\nWorld\n</custom>\n\n'
		);
		expect(preprocessCustomTags('<custom>A\n\nB\n\nC</custom>', ['custom'])).toBe(
			'<custom>\nA\n<!---->\nB\n<!---->\nC\n</custom>\n\n'
		);
		expect(preprocessCustomTags('<foo>A\n\nB</foo>\n<bar>C\n\nD</bar>', ['foo', 'bar'])).toContain(
			'<foo>\nA\n<!---->\nB\n</foo>'
		);
		expect(
			preprocessCustomTags('<custom class=\"test\" id=\"x\">A\n\nB</custom>', ['custom'])
		).toBe('<custom class=\"test\" id=\"x\">\nA\n<!---->\nB\n</custom>\n\n');
		expect(preprocessCustomTags('<Custom>A\n\nB</Custom>', ['custom'])).toBe(
			'<Custom>\nA\n<!---->\nB\n</Custom>\n\n'
		);
		expect(preprocessCustomTags('# Hello\n\nWorld', ['custom'])).toBe('# Hello\n\nWorld');
		expect(preprocessCustomTags('<custom>Hello World</custom>', ['custom'])).toBe(
			'<custom>Hello World</custom>'
		);
		expect(preprocessCustomTags('<custom>\nHello\n</custom>', ['custom'])).toBe(
			'<custom>\nHello\n</custom>'
		);
		expect(
			preprocessCustomTags(
				'<ai-thinking>this is thinking\n\n * why is break?</ai-thinking># Hello World',
				['ai-thinking']
			)
		).toBe(
			'<ai-thinking>\nthis is thinking\n<!---->\n * why is break?\n</ai-thinking>\n\n# Hello World'
		);
	});
});
