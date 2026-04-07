// @ts-nocheck
import { bench, describe } from 'vitest';
import remend from '../../../packages/remend/src/index.ts';
import { parserBenchOptions } from '../shared/bench-options';
import { remendBenchmarkCases } from '../shared/remend-cases';

for (const group of new Set(remendBenchmarkCases.map((entry) => entry.group))) {
	describe(group, () => {
		for (const scenario of remendBenchmarkCases.filter((entry) => entry.group === group)) {
			bench(
				scenario.name,
				() => {
					if (scenario.name === 'streaming bold text (10 steps)') {
						for (const step of scenario.input.split('\n')) {
							remend(step);
						}
						return;
					}

					if (scenario.name === 'streaming inline code (6 steps)') {
						for (const step of scenario.input.split('\n')) {
							remend(step);
						}
						return;
					}

					remend(scenario.input);
				},
				parserBenchOptions
			);
		}
	});
}
