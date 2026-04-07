import { describe, expect, test } from 'vitest';
import { resolveThemeClassMap } from '../lib/streamdown/config.js';
import { shadcnTheme, theme } from '../lib/theme.js';

describe('theme contracts', () => {
	test('ships exactly two built-in base themes', () => {
		expect(theme).toBeTruthy();
		expect(shadcnTheme).toBeTruthy();
	});

	test('keeps the default theme on semantic color tokens for critical surfaces', () => {
		expect(theme.link.base).toContain('text-primary');
		expect(theme.link.blocked).toContain('text-muted-foreground');
		expect(theme.paragraph.base).toContain('text-foreground');
		expect(theme.codespan.base).toContain('bg-muted');
		expect(theme.codespan.base).toContain('text-foreground');
		expect(theme.code.base).toContain('border-border');
		expect(theme.code.base).toContain('bg-sidebar');
		expect(theme.code.container).toContain('bg-background');
		expect(theme.code.buttons).toContain('bg-background/90');
		expect(theme.blockquote.base).toContain('text-muted-foreground');
		expect(theme.table.wrapper).toContain('bg-background');
		expect(theme.table.toolbar).toContain('bg-muted/80');
		expect(theme.mermaid.base).toContain('bg-background');
		expect(theme.math.inline).toContain('text-foreground');
		expect(theme.components.button).toContain('text-muted-foreground');
		expect(theme.components.popover).toContain('bg-background');
		expect(theme.components.popover).toContain('text-foreground');
	});

	test('does not regress critical default theme surfaces back to hard-coded neutral colors', () => {
		const criticalSurfaces = [
			theme.paragraph.base,
			theme.codespan.base,
			theme.code.base,
			theme.code.container,
			theme.code.buttons,
			theme.blockquote.base,
			theme.table.wrapper,
			theme.table.toolbar,
			theme.table.container,
			theme.mermaid.base,
			theme.footnoteRef.base,
			theme.descriptionTerm.base,
			theme.descriptionDetail.base,
			theme.components.button,
			theme.components.popover
		].join(' ');

		expect(criticalSurfaces).not.toMatch(/\bbg-white\b/);
		expect(criticalSurfaces).not.toMatch(/\bbg-gray-\d+\b/);
		expect(criticalSurfaces).not.toMatch(/\btext-gray-\d+\b/);
		expect(criticalSurfaces).not.toMatch(/\bborder-gray-\d+\b/);
	});

	test('resolves the requested built-in base theme through the runtime config helper', () => {
		const tailwindResolved = resolveThemeClassMap({
			theme: undefined,
			baseTheme: 'tailwind',
			shouldMergeTheme: true,
			prefix: undefined
		});
		const shadcnResolved = resolveThemeClassMap({
			theme: undefined,
			baseTheme: 'shadcn',
			shouldMergeTheme: true,
			prefix: undefined
		});

		expect(tailwindResolved.codespan.base).toBe(theme.codespan.base);
		expect(shadcnResolved.codespan.base).toBe(shadcnTheme.codespan.base);
	});
});
