import { expect } from 'vitest';
import { assertTestEnvironment } from './environment.js';

type HtmlLike = string | { innerHTML: string };

function readHtml(value: HtmlLike): string {
	if (typeof value === 'string') {
		return value;
	}

	return value.innerHTML;
}

export function normalizeDomHtml(value: HtmlLike): string {
	return readHtml(value)
		.replace(/<!---->/g, '')
		.replace(/\sclass="[^"]*"/g, '')
		.replace(/\sstyle="[^"]*"/g, '')
		.replace(/\sdata-streamdown-[^=]+="[^"]*"/g, '')
		.replace(/>\s+</g, '><')
		.replace(/\s+/g, ' ')
		.trim();
}

export function expectNormalizedHtml(actual: HtmlLike, expected: HtmlLike): void {
	expect(normalizeDomHtml(actual)).toBe(normalizeDomHtml(expected));
}

export function getNormalizedInnerHtml(element: { innerHTML: string }): string {
	assertTestEnvironment('browser');
	return normalizeDomHtml(element);
}
