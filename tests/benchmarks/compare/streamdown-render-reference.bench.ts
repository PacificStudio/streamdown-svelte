// @ts-nocheck
import { bench, describe } from 'vitest';
import { renderBenchOptions } from '../shared/bench-options';
import { renderBenchmarkCases } from '../shared/render-cases';
import { renderLocalStreamdown, renderReferenceStreamdown } from '../shared/render-helpers';

for (const scenario of renderBenchmarkCases.filter((entry) => entry.compare)) {
	describe(scenario.name, () => {
		bench(
			'local',
			() => {
				renderLocalStreamdown(scenario.content);
			},
			renderBenchOptions
		);

		bench(
			'reference',
			() => {
				renderReferenceStreamdown(scenario.content);
			},
			renderBenchOptions
		);
	});
}
