import { expect, test, type Page } from '@playwright/test';

const appBaseUrl = process.env.PLAYGROUND_LOCAL_URL ?? 'http://127.0.0.1:4175';
const markdownInputSelector = 'textarea[placeholder="Type your markdown here..."]';
const codeBlockSelector = '[data-streamdown="code-block"]';
const codeBodySelector = '[data-streamdown="code-block-body"]';
const codeTokenSelector = '.sd-code-line span';

const codeProbeMarkdown = [
	'```svelte',
	'import { Streamdown } from "streamdown-svelte";',
	'```'
].join('\n');

type ThemeProbe = {
	backgroundColor: string;
	htmlDataTheme: string | null;
	tokenColor: string;
};

test.describe('playground code theme contract', () => {
	test('keeps plugin-backed code colors aligned with the active light/dark toggle', async ({
		page
	}) => {
		await page.goto(`${appBaseUrl}/playground`, { waitUntil: 'networkidle' });
		await page.locator(markdownInputSelector).fill(codeProbeMarkdown);
		await expect(page.locator(codeBlockSelector)).toHaveCount(1);
		await expect(page.locator(codeBlockSelector)).toContainText(
			'import { Streamdown } from "streamdown-svelte";'
		);

		const lightSnapshot = await readThemeProbe(page);
		expect(lightSnapshot).toEqual({
			htmlDataTheme: 'light',
			tokenColor: 'rgb(36, 41, 46)',
			backgroundColor: 'oklch(1 0 0)'
		});

		await page.getByRole('button', { name: 'Dark' }).click();
		await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();

		const darkSnapshot = await readThemeProbe(page);
		expect(darkSnapshot).toEqual({
			htmlDataTheme: 'dark',
			tokenColor: 'rgb(225, 228, 232)',
			backgroundColor: 'oklch(0.145 0 0)'
		});

		await page.getByRole('button', { name: 'Light' }).click();
		await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();

		const lightResetSnapshot = await readThemeProbe(page);
		expect(lightResetSnapshot).toEqual(lightSnapshot);
	});
});

async function readThemeProbe(page: Page): Promise<ThemeProbe> {
	await expect
		.poll(async () => {
			return page.locator(`${codeBodySelector} ${codeTokenSelector}`).count();
		})
		.toBeGreaterThan(0);

	return page.locator(codeBlockSelector).evaluate((codeBlock) => {
		const codeBody = codeBlock.querySelector<HTMLElement>('[data-streamdown="code-block-body"]');
		const token = codeBlock.querySelector<HTMLElement>('.sd-code-line span');
		if (!codeBody || !token) {
			throw new Error('Playground code theme probe could not find the code body or token span.');
		}

		return {
			tokenColor: getComputedStyle(token).color,
			backgroundColor: getComputedStyle(codeBody).backgroundColor,
			htmlDataTheme: document.documentElement.getAttribute('data-theme')
		};
	});
}
