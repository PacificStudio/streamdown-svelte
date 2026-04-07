// @ts-nocheck
import { bench, describe } from 'vitest';
import {
	tableDataToCSV,
	tableDataToMarkdown,
	tableDataToTSV
} from '../../../src/lib/utils/table.js';
import { utilityBenchOptions } from '../shared/bench-options';
import { tableBenchmarkCases } from '../shared/table-cases';

for (const group of new Set(tableBenchmarkCases.map((entry) => entry.group))) {
	describe(group, () => {
		for (const scenario of tableBenchmarkCases.filter((entry) => entry.group === group)) {
			const run =
				scenario.formatter === 'csv'
					? tableDataToCSV
					: scenario.formatter === 'tsv'
						? tableDataToTSV
						: tableDataToMarkdown;

			bench(
				scenario.name,
				() => {
					run(scenario.table);
				},
				utilityBenchOptions
			);
		}
	});
}
