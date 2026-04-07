// @ts-nocheck
import { bench, describe } from 'vitest';
import { parseBlocks } from '../../../src/lib/marked/index.js';
import { parserBenchOptions } from '../shared/bench-options';
import { parseBlockBenchmarkCases } from '../shared/parse-block-cases';

for (const group of new Set(parseBlockBenchmarkCases.map((entry) => entry.group))) {
	describe(group, () => {
		for (const scenario of parseBlockBenchmarkCases.filter((entry) => entry.group === group)) {
			bench(
				scenario.name,
				() => {
					parseBlocks(scenario.input);
				},
				parserBenchOptions
			);
		}
	});
}
