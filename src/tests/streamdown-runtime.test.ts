import { describe, expect, it } from 'vitest';
import {
	defineRuntimeSectionBridge,
	StreamdownParseRuntime,
	StreamdownUiConfigRuntime
} from '../lib/streamdown/runtime.js';

describe('streamdown runtime bridges', () => {
	it('keeps parse runtime values live through getter-backed properties', () => {
		let content = 'alpha';
		let mode: 'static' | 'streaming' = 'streaming';
		let sources: Record<string, { id: number }> = { first: { id: 1 } };
		let extensions: [] = [];

		const runtime = new StreamdownParseRuntime({
			content: () => content,
			remend: () => undefined,
			parseIncompleteMarkdown: () => true,
			parseMarkdownIntoBlocksFn: () => undefined,
			mode: () => mode,
			dir: () => 'auto',
			sources: () => sources,
			inlineCitationsMode: () => 'list',
			extensions: () => extensions
		});

		expect(runtime.content).toBe('alpha');
		expect(runtime.mode).toBe('streaming');
		expect(runtime.sources).toEqual({ first: { id: 1 } });

		content = 'beta';
		mode = 'static';
		sources = { second: { id: 2 } };

		expect(runtime.content).toBe('beta');
		expect(runtime.mode).toBe('static');
		expect(runtime.sources).toEqual({ second: { id: 2 } });
	});

	it('bridges section properties onto a host object without snapshotting values', () => {
		let isAnimating = true;
		let caret: 'block' | 'circle' = 'block';

		const uiConfig = new StreamdownUiConfigRuntime({
			element: () => undefined,
			animation: () => ({ enabled: isAnimating, type: 'fade', duration: 150 }),
			isAnimating: () => isAnimating,
			animated: () => false,
			caret: () => caret,
			onAnimationStart: () => undefined,
			onAnimationEnd: () => undefined,
			controls: () => ({
				code: true,
				mermaid: {
					enabled: true,
					download: true,
					fullscreen: true,
					panZoom: true,
					mouseWheelZoom: true
				},
				table: true
			}),
			codeControls: () => ({ copy: true, download: true }),
			icons: () => ({})
		});

		const host = { uiConfig } as {
			uiConfig: StreamdownUiConfigRuntime;
			isAnimating: boolean;
			caret: 'block' | 'circle';
			animation: { enabled: boolean; type: string; duration: number };
		};

		defineRuntimeSectionBridge(host, 'uiConfig', () => host.uiConfig);

		expect(host.isAnimating).toBe(true);
		expect(host.caret).toBe('block');
		expect(host.animation.enabled).toBe(true);

		isAnimating = false;
		caret = 'circle';

		expect(host.isAnimating).toBe(false);
		expect(host.caret).toBe('circle');
		expect(host.animation.enabled).toBe(false);
	});
});
