// @ts-nocheck
import { bench, describe } from 'vitest';
import {
	tableDataToCSV as localTableDataToCSV,
	tableDataToMarkdown as localTableDataToMarkdown,
	tableDataToTSV as localTableDataToTSV
} from '../../../src/lib/utils/table.js';
import {
	referenceTableDataToCSV,
	referenceTableDataToMarkdown,
	referenceTableDataToTSV
} from '../shared/reference-adapters';
import { utilityBenchOptions } from '../shared/bench-options';
import { tableBenchmarkCases } from '../shared/table-cases';

const resolverByGroup = {
	csv: [localTableDataToCSV, referenceTableDataToCSV],
	tsv: [localTableDataToTSV, referenceTableDataToTSV],
	markdown: [localTableDataToMarkdown, referenceTableDataToMarkdown]
} as const;

for (const scenario of tableBenchmarkCases.filter((entry) => entry.compare)) {
	describe(`${scenario.group} / ${scenario.name}`, () => {
		const [localFormatter, referenceFormatter] = resolverByGroup[scenario.formatter];

		bench(
			'local',
			() => {
				localFormatter(scenario.table);
			},
			utilityBenchOptions
		);

		bench(
			'reference',
			() => {
				referenceFormatter(scenario.table);
			},
			utilityBenchOptions
		);
	});
}
