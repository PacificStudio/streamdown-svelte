import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

type MatrixRow = {
	id: string;
	status: string;
};

type BacklogRow = {
	category: string;
	nextAction: string;
	referenceFile: string;
};

type DriftRow = {
	id: string;
};

function parseMarkdownRow(line: string): string[] {
	return line
		.slice(1, -1)
		.split('|')
		.map((cell) => cell.trim());
}

function unwrapCode(cell: string): string {
	return cell.replace(/^`/, '').replace(/`$/, '');
}

function readDoc(relativePath: string): string {
	const url = new URL(`../../${relativePath}`, import.meta.url);
	return readFileSync(url, 'utf8');
}

function collectMatrixRows(markdown: string): MatrixRow[] {
	const rows: MatrixRow[] = [];

	for (const line of markdown.split('\n')) {
		if (!line.startsWith('|')) {
			continue;
		}

		const cells = parseMarkdownRow(line);
		if (cells.length < 3 || cells[0] === 'ID' || /^-+$/.test(cells[0])) {
			continue;
		}

		const id = unwrapCode(cells[0]);
		if (!/^(api|prop|plugin)-\d+$/.test(id)) {
			continue;
		}

		rows.push({
			id,
			status: unwrapCode(cells[2])
		});
	}

	return rows;
}

function collectRemainingBacklogRows(markdown: string): BacklogRow[] {
	const rows: BacklogRow[] = [];
	let inSection = false;

	for (const line of markdown.split('\n')) {
		if (line.startsWith('## ')) {
			inSection = line.trim() === '## Categorized Remaining Test Backlog';
			continue;
		}

		if (!inSection || !line.startsWith('|')) {
			continue;
		}

		const cells = parseMarkdownRow(line);
		if (cells.length < 3 || cells[0] === 'Parity category' || /^-+$/.test(cells[0])) {
			continue;
		}

		rows.push({
			category: unwrapCode(cells[0]),
			nextAction: unwrapCode(cells[1]),
			referenceFile: unwrapCode(cells[2])
		});
	}

	return rows;
}

function collectDriftRows(markdown: string): DriftRow[] {
	const rows: DriftRow[] = [];
	let inSection = false;

	for (const line of markdown.split('\n')) {
		if (line.startsWith('## ')) {
			inSection = line.trim() === '## Local-Only Drift';
			continue;
		}

		if (!inSection || !line.startsWith('|')) {
			continue;
		}

		const cells = parseMarkdownRow(line);
		if (cells.length < 1 || cells[0] === 'ID' || /^-+$/.test(cells[0])) {
			continue;
		}

		const id = unwrapCode(cells[0]);
		if (/^drift-\d+$/.test(id)) {
			rows.push({ id });
		}
	}

	return rows;
}

function collectReferencedDriftIds(markdown: string): string[] {
	return [...new Set(markdown.match(/drift-\d+/g) ?? [])];
}

describe('parity boundary documentation', () => {
	test('keeps plugin and package-boundary matrix rows in final-state classifications', () => {
		const matrixRows = new Map(
			collectMatrixRows(readDoc('docs/parity-matrix.md')).map((row) => [row.id, row.status])
		);

		const expectedStatuses = new Map<string, string>([
			['api-01', 'different_by_design'],
			['api-02', 'different_by_design'],
			['api-03', 'different_by_design'],
			['api-04', 'different_by_design'],
			['api-05', 'different_by_design'],
			['api-06', 'different_by_design'],
			['api-07', 'different_by_design'],
			['api-08', 'different_by_design'],
			['prop-11', 'done'],
			['prop-12', 'different_by_design'],
			['prop-17', 'done'],
			['prop-20', 'different_by_design'],
			['plugin-01', 'done'],
			['plugin-02', 'different_by_design'],
			['plugin-03', 'different_by_design'],
			['plugin-04', 'different_by_design'],
			['plugin-05', 'different_by_design'],
			['plugin-06', 'done']
		]);

		for (const [id, expectedStatus] of expectedStatuses) {
			expect(matrixRows.get(id), `Unexpected matrix status for ${id}`).toBe(expectedStatus);
		}
	});

	test('keeps package/export backlog items out of the implement bucket once they are accepted drift', () => {
		const backlogRows = collectRemainingBacklogRows(readDoc('docs/reference-tests-inventory.md'));
		const packageBoundaryRows = backlogRows.filter(
			(row) => row.category === 'package/export boundaries'
		);

		const acceptedDriftFiles = new Set([
			'packages/remend/__tests__/custom-handlers.test.ts',
			'packages/remend/__tests__/utils.test.ts',
			'packages/streamdown/__tests__/detect-direction.test.ts',
			'packages/streamdown/__tests__/icon-context.test.tsx',
			'packages/streamdown/__tests__/utils.test.ts',
			'packages/streamdown-cjk/__tests__/index.test.ts',
			'packages/streamdown-code/__tests__/index.test.ts',
			'packages/streamdown-math/__tests__/index.test.ts',
			'packages/streamdown-mermaid/__tests__/index.test.ts'
		]);

		for (const row of packageBoundaryRows) {
			if (acceptedDriftFiles.has(row.referenceFile)) {
				expect(row.nextAction, `Unexpected next action for ${row.referenceFile}`).toBe(
					'accepted drift'
				);
			}
		}

		expect(
			packageBoundaryRows
				.filter((row) => acceptedDriftFiles.has(row.referenceFile))
				.some((row) => row.nextAction === 'implement')
		).toBe(false);
	});

	test('keeps plugin accepted-drift backlog items out of the implement bucket once they are classified drift', () => {
		const backlogRows = collectRemainingBacklogRows(readDoc('docs/reference-tests-inventory.md'));
		const pluginContextRow = backlogRows.find(
			(row) => row.referenceFile === 'packages/streamdown/__tests__/plugin-context.test.tsx'
		);

		expect(pluginContextRow).toBeDefined();
		expect(pluginContextRow?.category).toBe('plugins');
		expect(pluginContextRow?.nextAction).toBe('accepted drift');
	});

	test('defines every drift id that the parity matrix cites as accepted rationale', () => {
		const matrixMarkdown = readDoc('docs/parity-matrix.md');
		const definedDriftIds = new Set(collectDriftRows(matrixMarkdown).map((row) => row.id));

		for (const driftId of collectReferencedDriftIds(matrixMarkdown)) {
			expect(definedDriftIds.has(driftId), `Missing Local-Only Drift row for ${driftId}`).toBe(
				true
			);
		}
	});
});
