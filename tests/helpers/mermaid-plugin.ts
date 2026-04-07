import { vi } from 'vitest';
import type { DiagramPlugin, MermaidInstance } from '../../src/lib/contracts/plugins.js';

type MermaidRenderResult = Promise<{ svg: string }>;
type MermaidRender = MermaidInstance['render'];
type MermaidInitialize = MermaidInstance['initialize'];

export function createStubMermaidPlugin(options?: {
	initialize?: MermaidInitialize;
	render?: MermaidRender;
}) {
	const initialize = options?.initialize ?? vi.fn<MermaidInitialize>();
	const render =
		options?.render ??
		vi.fn<MermaidRender>(async () => ({
			svg: '<svg width="120" height="80"><text>Graph</text></svg>'
		}));
	const plugin: DiagramPlugin = {
		name: 'mermaid',
		type: 'diagram',
		language: 'mermaid',
		getMermaid: () => ({
			initialize,
			render
		})
	};

	return {
		initialize,
		render,
		plugin
	};
}
