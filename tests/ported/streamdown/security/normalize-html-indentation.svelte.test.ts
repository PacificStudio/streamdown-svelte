import { expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Streamdown from '../../../../src/lib/Streamdown.svelte';
import { normalizeHtmlIndentation } from '../../../../src/lib/security/html.js';
import { describeInBrowser, testInBrowser } from '../../../helpers/index.js';

describeInBrowser('ported streamdown security normalize HTML indentation', () => {
	testInBrowser('normalizes indented HTML tags inside HTML blocks', () => {
		expect(normalizeHtmlIndentation('<div>\n    <span>Hello</span>\n</div>')).toBe(
			'<div>\n<span>Hello</span>\n</div>'
		);
	});

	testInBrowser('leaves non-HTML markdown unchanged', () => {
		const markdown = '# Hello World\n\nThis is a paragraph.';
		expect(normalizeHtmlIndentation(markdown)).toBe(markdown);
	});

	testInBrowser(
		'renders indented HTML blocks as HTML when the compatibility prop is enabled',
		() => {
			const screen = render(Streamdown, {
				content: `<div class="wrapper">
    <div class="inner">
      <h4>Title One</h4>
    </div>

    <div class="another">
      <h4>Title Two</h4>
    </div>
</div>`,
				static: true,
				normalizeHtmlIndentation: true
			});

			const headings = [...screen.container.querySelectorAll('h4')].map((element) =>
				element.textContent?.trim()
			);

			expect(headings).toContain('Title One');
			expect(headings).toContain('Title Two');
			expect(screen.container.querySelectorAll('code')).toHaveLength(0);
		}
	);

	testInBrowser('preserves complex nested HTML after normalization', () => {
		const screen = render(Streamdown, {
			content: `<article>
    <header>
        <h1>Article Title</h1>
    </header>
    <section>
        <h2>Section 1</h2>
        <p>Content here</p>
    </section>
    <footer>
        <p>Footer text</p>
    </footer>
</article>`,
			static: true,
			normalizeHtmlIndentation: true,
			allowedTags: {
				article: [],
				header: [],
				footer: []
			}
		});

		expect(screen.container.querySelector('h1')?.textContent).toBe('Article Title');
		expect(screen.container.querySelector('h2')?.textContent).toBe('Section 1');
		expect(screen.container.querySelector('footer')).toBeTruthy();
	});
});
