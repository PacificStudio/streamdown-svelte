import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const README_PATH = new URL('../../README.md', import.meta.url);
const DOCS_README_PATH = new URL('../../src/README.md', import.meta.url);
const STREAMDOWN_CONTEXT_PATH = new URL('../../src/lib/context.svelte.ts', import.meta.url);

function extractDocumentedProps(readme: string): string[] {
	const sectionMatch = readme.match(/## Props[\s\S]*?(?=\n## |\n# |$)/);
	expect(sectionMatch, 'README is missing the Props section').toBeTruthy();

	return [...sectionMatch![0].matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((match) => match[1]);
}

function extractPublicStreamdownProps(source: string): Set<string> {
	const typeMatch = source.match(
		/export type StreamdownProps<[\s\S]*?=\s*{([\s\S]*?)}\s*&\s*Partial<[^;]*>;/
	);
	expect(typeMatch, 'Unable to locate StreamdownProps in context.svelte.ts').toBeTruthy();

	const props = new Set<string>();
	let depth = 0;

	for (const rawLine of typeMatch![1].split('\n')) {
		const line = rawLine.trim();
		if (line.length === 0) {
			continue;
		}

		const openBraces = [...line].filter((char) => char === '{').length;
		const closeBraces = [...line].filter((char) => char === '}').length;

		if (depth === 0) {
			const propMatch = line.match(/^([A-Za-z_$][\w$]*)\??:/);
			if (propMatch) {
				props.add(propMatch[1]);
			}
		}

		depth += openBraces - closeBraces;
	}

	return props;
}

describe('README contract', () => {
	test('docs app README stays in sync with the package README', () => {
		const rootReadme = readFileSync(README_PATH, 'utf8');
		const docsReadme = readFileSync(DOCS_README_PATH, 'utf8');

		expect(docsReadme).toBe(rootReadme);
	});

	test('every documented prop exists on StreamdownProps', () => {
		const readme = readFileSync(README_PATH, 'utf8');
		const contextSource = readFileSync(STREAMDOWN_CONTEXT_PATH, 'utf8');
		const documentedProps = extractDocumentedProps(readme);
		const publicProps = extractPublicStreamdownProps(contextSource);

		expect(documentedProps.length).toBeGreaterThan(0);
		expect(documentedProps.filter((prop) => !publicProps.has(prop))).toEqual([]);
	});
});
