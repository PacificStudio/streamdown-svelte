// @ts-nocheck
import { bench, describe } from 'vitest';
import localRemend from '../../../packages/remend/src/index.ts';
import { parserBenchOptions } from '../shared/bench-options';
import { referenceRemend } from '../shared/reference-adapters';
import { remendBenchmarkCases } from '../shared/remend-cases';

for (const scenario of remendBenchmarkCases.filter((entry) => entry.compare)) {
	describe(scenario.name, () => {
		const steps = scenario.input.split('\n');
		const runScenario = (runner: (input: string) => string) => {
			if (
				scenario.name === 'streaming bold text (10 steps)' ||
				scenario.name === 'streaming inline code (6 steps)'
			) {
				for (const step of steps) {
					runner(step);
				}
				return;
			}

			runner(scenario.input);
		};

		bench('local', () => runScenario(localRemend), parserBenchOptions);
		bench('reference', () => runScenario(referenceRemend), parserBenchOptions);
	});
}
