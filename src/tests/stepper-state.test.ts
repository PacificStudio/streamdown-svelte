import { describe, expect, it } from 'vitest';
import { StepperState } from '../lib/Elements/stepperState.svelte.js';

describe('StepperState', () => {
	it('keeps getter-backed items live instead of snapshotting the initial array', () => {
		let items = ['first'];
		const state = new StepperState({
			get items() {
				return items;
			},
			keyFramesOptions: {
				duration: 200,
				easing: 'ease-in-out',
				fill: 'forwards'
			}
		});

		expect(state.items).toEqual(['first']);
		expect(state.canGoNext).toBe(false);

		items = ['first', 'second', 'third'];

		expect(state.items).toEqual(['first', 'second', 'third']);
		expect(state.canGoNext).toBe(true);
		expect(state.canGoToStep(2)).toBe(true);
		expect(state.canGoToStep(3)).toBe(false);
	});
});
