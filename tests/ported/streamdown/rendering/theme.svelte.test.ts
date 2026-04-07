import { render } from 'vitest-browser-svelte';
import { expect } from 'vitest';
import Streamdown from '../../../../src/lib/Streamdown.svelte';
import { describeInBrowser, testInBrowser } from '../../../helpers/index.js';

describeInBrowser('streamdown theme rendering', () => {
	testInBrowser('renders inline code with semantic theme classes in the default theme', () => {
		const screen = render(Streamdown, {
			content: 'Install the package, then pass `content` into Streamdown.',
			mode: 'static'
		});

		const inlineCode = screen.container.querySelector('[data-streamdown-codespan]');

		expect(inlineCode?.className).toContain('bg-muted');
		expect(inlineCode?.className).toContain('text-foreground');
	});

	testInBrowser('keeps code block chrome on semantic classes in the default theme', () => {
		const screen = render(Streamdown, {
			content: '```ts\nconst answer = 42;\n```',
			mode: 'static'
		});

		const codeBlock = screen.container.querySelector('[data-streamdown="code-block"]');
		const codeHeader = screen.container.querySelector('[data-streamdown="code-block-header"]');

		expect(codeBlock?.className).toContain('border-border');
		expect(codeBlock?.className).toContain('bg-sidebar');
		expect(codeHeader?.className).toContain('text-muted-foreground');
	});
});
