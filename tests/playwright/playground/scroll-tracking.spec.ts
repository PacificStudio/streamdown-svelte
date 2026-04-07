import { expect, test, type Page } from '@playwright/test';

const appBaseUrl = process.env.PLAYGROUND_LOCAL_URL ?? 'http://127.0.0.1:4175';
const markdownInputSelector = 'textarea[placeholder="Type your markdown here..."]';
const outputScrollSelector = '[data-playground-output-scroll]';
const scrollButtonSelector = '[data-playground-scroll-cta]';

type ScrollProbe = {
	scrollHeight: number;
	clientHeight: number;
	scrollTop: number;
	distanceFromBottom: number;
};

const buildLongMarkdown = (count: number) =>
	Array.from({ length: count }, (_, index) => `## Section ${index + 1}\n\nParagraph ${index + 1}\n`)
		.join('\n')
		.trim();

test.describe('playground scroll tracking', () => {
	test('sticks to bottom until the user scrolls away, then resumes on demand', async ({ page }) => {
		await page.goto(`${appBaseUrl}/playground`, { waitUntil: 'networkidle' });

		const initialMarkdown = buildLongMarkdown(90);
		await page.locator(markdownInputSelector).fill(initialMarkdown);

		await expect
			.poll(async () => (await readScrollProbe(page)).distanceFromBottom)
			.toBeLessThanOrEqual(4);

		await page.waitForTimeout(400);
		await page.locator(outputScrollSelector).hover();
		await page.mouse.wheel(0, -4_000);

		await expect(page.locator(scrollButtonSelector)).toBeVisible();
		await expect
			.poll(async () => (await readScrollProbe(page)).distanceFromBottom)
			.toBeGreaterThan(600);

		await page
			.locator(markdownInputSelector)
			.fill(`${initialMarkdown}\n\n${buildLongMarkdown(30)}`);

		await expect(page.locator(scrollButtonSelector)).toBeVisible();
		await expect
			.poll(async () => (await readScrollProbe(page)).distanceFromBottom)
			.toBeGreaterThan(600);

		await page.locator(scrollButtonSelector).click();

		await expect(page.locator(scrollButtonSelector)).toBeHidden();
		await expect
			.poll(async () => (await readScrollProbe(page)).distanceFromBottom)
			.toBeLessThanOrEqual(4);
	});
});

async function readScrollProbe(page: Page): Promise<ScrollProbe> {
	return page.locator(outputScrollSelector).evaluate((element) => ({
		scrollHeight: element.scrollHeight,
		clientHeight: element.clientHeight,
		scrollTop: element.scrollTop,
		distanceFromBottom: element.scrollHeight - element.clientHeight - element.scrollTop
	}));
}
