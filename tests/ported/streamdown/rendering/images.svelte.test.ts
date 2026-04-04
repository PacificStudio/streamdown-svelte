import { afterEach, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Streamdown from '../../../../src/lib/Streamdown.svelte';
import { describeInBrowser, testInBrowser } from '../../../helpers/index.js';

const { saveMock } = vi.hoisted(() => ({
	saveMock: vi.fn()
}));

vi.mock('$lib/utils/save.js', () => ({
	save: saveMock
}));

let restoreImagePrototype: (() => void) | null = null;
const originalFetch = globalThis.fetch;

afterEach(() => {
	restoreImagePrototype?.();
	restoreImagePrototype = null;
	globalThis.fetch = originalFetch;
	vi.restoreAllMocks();
});

function mockImageElementState({
	complete,
	naturalWidth
}: {
	complete: boolean;
	naturalWidth: number;
}) {
	const completeDescriptor = Object.getOwnPropertyDescriptor(
		HTMLImageElement.prototype,
		'complete'
	);
	const naturalWidthDescriptor = Object.getOwnPropertyDescriptor(
		HTMLImageElement.prototype,
		'naturalWidth'
	);

	Object.defineProperty(HTMLImageElement.prototype, 'complete', {
		configurable: true,
		get() {
			return complete;
		}
	});

	Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
		configurable: true,
		get() {
			return naturalWidth;
		}
	});

	restoreImagePrototype = () => {
		if (completeDescriptor) {
			Object.defineProperty(HTMLImageElement.prototype, 'complete', completeDescriptor);
		} else {
			delete (HTMLImageElement.prototype as { complete?: boolean }).complete;
		}

		if (naturalWidthDescriptor) {
			Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', naturalWidthDescriptor);
		} else {
			delete (HTMLImageElement.prototype as { naturalWidth?: number }).naturalWidth;
		}
	};
}

describeInBrowser('ported streamdown image rendering', () => {
	testInBrowser(
		'keeps standalone images out of paragraph wrappers to avoid hydration mismatches',
		() => {
			const screen = render(Streamdown, {
				content: [
					'## Links',
					'',
					'[GitHub](https://github.com/)',
					'',
					'![Image](https://example.com/image.png)',
					'',
					'![Image 2](https://example.com/image-2.png)'
				].join('\n')
			});

			const wrappers = [...screen.container.querySelectorAll('[data-streamdown-image]')];
			expect(wrappers).toHaveLength(2);
			expect(wrappers.every((wrapper) => wrapper.closest('p') === null)).toBe(true);
		}
	);

	testInBrowser('keeps inline images inside paragraph content', () => {
		const screen = render(Streamdown, {
			content: 'This is text with ![Inline image](https://example.com/inline.png) inline.'
		});

		const paragraph = screen.container.querySelector('p');
		expect(paragraph).toBeTruthy();
		expect(paragraph?.querySelector('img[alt="Inline image"]')).toBeTruthy();
	});

	testInBrowser('renders safe and relative images but blocks unsafe image urls', () => {
		const safe = render(Streamdown, {
			content: '![Relative image](/assets/example.png)'
		});
		const blocked = render(Streamdown, {
			content: '![Blocked image](javascript:alert(1))'
		});

		expect(safe.container.querySelector('img[alt="Relative image"]')?.getAttribute('src')).toBe(
			'/assets/example.png'
		);
		expect(
			blocked.container.querySelector('[data-streamdown-image-blocked]')?.textContent
		).toContain('Blocked image');
	});

	testInBrowser('shows download controls after load and fallback content after error', async () => {
		saveMock.mockReset();
		const loadScreen = render(Streamdown, {
			content: '![Loaded image](https://example.com/loaded.png)'
		});
		await vi.waitFor(() => {
			const loadedImage = loadScreen.container.querySelector(
				'img[alt="Loaded image"]'
			) as HTMLImageElement | null;
			expect(loadedImage).toBeTruthy();
			loadedImage?.dispatchEvent(new Event('load'));
		});

		await vi.waitFor(() => {
			expect(loadScreen.container.querySelector('button[title="Download image"]')).toBeTruthy();
		});

		globalThis.fetch = vi.fn().mockResolvedValue({
			blob: async () => new Blob(['image'], { type: 'image/png' })
		}) as typeof fetch;
		(
			loadScreen.container.querySelector('button[title="Download image"]') as HTMLButtonElement
		).click();

		await vi.waitFor(() => {
			expect(saveMock).toHaveBeenCalledWith('loaded.png', expect.any(Blob), 'image/png');
		});

		const errorScreen = render(Streamdown, {
			content: '![Broken image](https://example.com/broken.png)'
		});
		await vi.waitFor(() => {
			const brokenImage = errorScreen.container.querySelector(
				'img[alt="Broken image"]'
			) as HTMLImageElement | null;
			expect(brokenImage).toBeTruthy();
			brokenImage?.dispatchEvent(new Event('error'));
		});

		await vi.waitFor(() => {
			expect(
				errorScreen.container.querySelector('[data-streamdown-image-fallback]')?.textContent
			).toContain('Image not available');
		});
		expect(errorScreen.container.querySelector('button[title="Download image"]')).toBeNull();
	});

	testInBrowser('treats already-complete cached images as loaded on mount', async () => {
		mockImageElementState({ complete: true, naturalWidth: 320 });

		const screen = render(Streamdown, {
			content: '![Cached image](https://example.com/cached.png)'
		});

		await vi.waitFor(() => {
			expect(screen.container.querySelector('button[title="Download image"]')).toBeTruthy();
		});
	});
});
