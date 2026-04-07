// @ts-nocheck
import { bench, describe } from 'vitest';
import { renderLocalStreamdown } from '../shared/render-helpers';
import { renderBenchOptions } from '../shared/bench-options';
import { renderBenchmarkCases } from '../shared/render-cases';

describe('Static Render', () => {
	for (const scenario of renderBenchmarkCases) {
		bench(
			scenario.name,
			() => {
				renderLocalStreamdown(scenario.content);
			},
			renderBenchOptions
		);
	}
});
