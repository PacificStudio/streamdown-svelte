// @ts-nocheck
import { bench, describe } from 'vitest';
import { parseBlocks as parseLocalBlocks } from '../../../src/lib/marked/index.js';
import { parserBenchOptions } from '../shared/bench-options';
import { parseBlockBenchmarkCases } from '../shared/parse-block-cases';
import { referenceParseBlocks } from '../shared/reference-adapters';

for (const scenario of parseBlockBenchmarkCases.filter((entry) => entry.compare)) {
	describe(scenario.name, () => {
		bench(
			'local',
			() => {
				parseLocalBlocks(scenario.input);
			},
			parserBenchOptions
		);

		bench(
			'reference',
			() => {
				referenceParseBlocks(scenario.input);
			},
			parserBenchOptions
		);
	});
}
