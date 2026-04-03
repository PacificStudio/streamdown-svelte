import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function readUtf8(path) {
	return readFileSync(path, 'utf8');
}

function parseNonEmptyLine(raw, source) {
	const value = raw.trim();

	if (!value) {
		throw new Error(`${source} must contain a non-empty version string`);
	}

	return value;
}

function parsePinnedPackageManager(raw) {
	const value = raw.trim();
	const match = /^pnpm@([0-9]+\.[0-9]+\.[0-9]+)$/.exec(value);

	if (!match) {
		throw new Error(
			`packageManager must be pinned as pnpm@<major>.<minor>.<patch>, received: ${value}`
		);
	}

	return {
		name: 'pnpm',
		version: match[1]
	};
}

function parseExactEngineVersion(raw, engineName) {
	const value = raw.trim();
	const match = /^([0-9]+\.[0-9]+\.[0-9]+)$/.exec(value);

	if (!match) {
		throw new Error(
			`${engineName} must be pinned to an exact <major>.<minor>.<patch> version, received: ${value}`
		);
	}

	return match[1];
}

function readPackageJson() {
	return JSON.parse(readUtf8(new URL('../package.json', import.meta.url)));
}

function runCommand(command, args) {
	const result = spawnSync(command, args, {
		cwd: new URL('..', import.meta.url),
		encoding: 'utf8'
	});

	if (result.status !== 0) {
		const stderr = result.stderr.trim();
		const stdout = result.stdout.trim();
		throw new Error(
			[stderr, stdout].filter(Boolean).join('\n') || `Failed to run ${command} ${args.join(' ')}`
		);
	}

	return result.stdout.trim();
}

function main() {
	const packageJson = readPackageJson();
	const expectedNodeVersion = parseNonEmptyLine(
		readUtf8(new URL('../.nvmrc', import.meta.url)),
		'.nvmrc'
	);
	const expectedPackageManager = parsePinnedPackageManager(packageJson.packageManager ?? '');
	const expectedVoltaNode = parseExactEngineVersion(packageJson.volta?.node ?? '', 'volta.node');
	const expectedVoltaPnpm = parseExactEngineVersion(packageJson.volta?.pnpm ?? '', 'volta.pnpm');
	const currentNodeVersion = process.version.replace(/^v/, '');
	const currentPnpmVersion = runCommand('pnpm', ['--version']);

	if (expectedNodeVersion !== expectedVoltaNode) {
		throw new Error(
			`.nvmrc (${expectedNodeVersion}) and volta.node (${expectedVoltaNode}) must match exactly`
		);
	}

	if (expectedPackageManager.version !== expectedVoltaPnpm) {
		throw new Error(
			`packageManager (${expectedPackageManager.version}) and volta.pnpm (${expectedVoltaPnpm}) must match exactly`
		);
	}

	if (currentNodeVersion !== expectedNodeVersion) {
		throw new Error(
			`Node mismatch: expected ${expectedNodeVersion}, received ${currentNodeVersion}`
		);
	}

	if (currentPnpmVersion !== expectedPackageManager.version) {
		throw new Error(
			`pnpm mismatch: expected ${expectedPackageManager.version}, received ${currentPnpmVersion}`
		);
	}

	console.log(
		JSON.stringify(
			{
				node: currentNodeVersion,
				pnpm: currentPnpmVersion,
				sourceOfTruth: {
					nvmrc: expectedNodeVersion,
					packageManager: expectedPackageManager.version,
					volta: {
						node: expectedVoltaNode,
						pnpm: expectedVoltaPnpm
					}
				}
			},
			null,
			2
		)
	);
}

main();
