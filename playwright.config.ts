import { defineConfig } from '@playwright/test';

const referencePort = 4173;
const localPort = 4174;
const appPort = 4175;

type ServerTarget = 'reference' | 'local' | 'app';

function resolveRequestedServerTargets(): ServerTarget[] {
	const requestedArgs = new Set(process.argv.slice(2));
	const hasExplicitSuiteTarget = [...requestedArgs].some((arg) => arg.includes('tests/playwright/'));
	const needsParityServers =
		!hasExplicitSuiteTarget ||
		[...requestedArgs].some((arg) => arg.includes('tests/playwright/parity') || arg.includes('tests/playwright/commonmark'));
	const needsAppServer =
		!hasExplicitSuiteTarget || [...requestedArgs].some((arg) => arg.includes('tests/playwright/playground'));

	const targets: ServerTarget[] = [];
	if (needsParityServers) {
		targets.push('reference', 'local');
	}
	if (needsAppServer) {
		targets.push('app');
	}

	return targets;
}

const requestedServerTargets = resolveRequestedServerTargets();

const webServers = {
	reference: {
		command: `FORCE_COLOR=0 NO_COLOR=1 pnpm exec vite --config apps/parity-reference/vite.config.ts --host 127.0.0.1 --port ${referencePort}`,
		url: `http://127.0.0.1:${referencePort}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	},
	local: {
		command: `FORCE_COLOR=0 NO_COLOR=1 pnpm exec vite --config apps/parity-local/vite.config.ts --host 127.0.0.1 --port ${localPort}`,
		url: `http://127.0.0.1:${localPort}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	},
	app: {
		command: `FORCE_COLOR=0 NO_COLOR=1 pnpm exec vite --config vite.playwright.config.ts --host 127.0.0.1 --port ${appPort}`,
		url: `http://127.0.0.1:${appPort}`,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
} as const;

export default defineConfig({
	testDir: './tests/playwright',
	timeout: 30_000,
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	use: {
		colorScheme: 'light',
		deviceScaleFactor: 1,
		headless: true,
		locale: 'en-US',
		reducedMotion: 'reduce',
		timezoneId: 'UTC',
		viewport: {
			width: 1280,
			height: 900
		}
	},
	webServer: requestedServerTargets.map((target) => webServers[target])
});
