import { vi } from 'vitest';

type MermaidRenderResult = Promise<{ svg: string }>;
type MermaidRender = (id: string, chart: string) => MermaidRenderResult;
type MermaidInitialize = (config: Record<string, unknown>) => void;

export function createStubMermaidPlugin(options?: {
	initialize?: ReturnType<typeof vi.fn<MermaidInitialize>>;
	render?: ReturnType<typeof vi.fn<MermaidRender>>;
}) {
	const initialize =
		options?.initialize ??
		vi.fn<MermaidInitialize>();
	const render =
		options?.render ??
		vi.fn<MermaidRender>(async () => ({
			svg: '<svg width="120" height="80"><text>Graph</text></svg>'
		}));

	return {
		initialize,
		render,
		plugin: {
			name: 'mermaid' as const,
			type: 'diagram' as const,
			language: 'mermaid' as const,
			getMermaid: () => ({
				initialize,
				render
			})
		}
	};
}
