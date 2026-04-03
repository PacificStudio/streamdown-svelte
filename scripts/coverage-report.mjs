import { existsSync, globSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	coverageSourceExclude,
	coverageSourceInclude,
	coverageSuites,
	getCoverageSuite,
	getCoverageSuiteNames
} from '../config/coverage-suites.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const coverageRoot = resolve(repoRoot, 'coverage');

function parseArgs(argv) {
	const options = {
		suites: [],
		summaryFile: null
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (arg === '--') {
			continue;
		}

		if (arg === '--summary-file') {
			const value = argv[index + 1];

			if (!value) {
				throw new Error('--summary-file requires a path');
			}

			options.summaryFile = value;
			index += 1;
			continue;
		}

		if (arg.startsWith('--')) {
			throw new Error(`Unknown argument: ${arg}`);
		}

		options.suites.push(arg);
	}

	if (options.suites.length === 0) {
		options.suites = getCoverageSuiteNames();
	}

	return options;
}

function resolveSelectedSuites(suiteNames) {
	return suiteNames.map((name) => [name, getCoverageSuite(name)]);
}

function resolveTestFiles(testGlobs, excludedTestGlobs) {
	const excluded = new Set(
		excludedTestGlobs.flatMap((pattern) =>
			globSync(pattern, {
				cwd: repoRoot,
				nodir: true
			})
		)
	);
	const resolved = new Set();

	for (const pattern of testGlobs) {
		for (const file of globSync(pattern, { cwd: repoRoot, nodir: true })) {
			if (!excluded.has(file)) {
				resolved.add(file);
			}
		}
	}

	return [...resolved].sort((left, right) => left.localeCompare(right));
}

function runCommand(command, args) {
	const result = spawnSync(command, args, {
		cwd: repoRoot,
		stdio: 'inherit',
		env: process.env
	});

	if (result.status !== 0) {
		throw new Error(`Command failed: ${command} ${args.join(' ')}`);
	}
}

function readSummary(path) {
	if (!existsSync(path)) {
		throw new Error(`Expected coverage summary at ${relative(repoRoot, path)}`);
	}

	return JSON.parse(readFileSync(path, 'utf8'));
}

function formatPercent(value) {
	return `${value.toFixed(2)}%`;
}

function readSuiteMetrics(summaryPath) {
	const summary = readSummary(summaryPath);
	const total = summary.total;

	if (!total) {
		throw new Error(`Coverage summary missing total metrics at ${relative(repoRoot, summaryPath)}`);
	}

	return {
		statements: total.statements?.pct ?? 0,
		branches: total.branches?.pct ?? 0,
		functions: total.functions?.pct ?? 0,
		lines: total.lines?.pct ?? 0
	};
}

function assertThresholds(name, metrics, thresholds) {
	for (const metricName of ['statements', 'branches', 'functions', 'lines']) {
		if (metrics[metricName] < thresholds[metricName]) {
			throw new Error(
				`${name} coverage for ${metricName} dropped below threshold: ` +
					`${formatPercent(metrics[metricName])} < ${formatPercent(thresholds[metricName])}`
			);
		}
	}
}

function renderMarkdown(results) {
	const lines = [
		'# Coverage Report',
		'',
		'| Suite | Statements | Branches | Functions | Lines | Minimum thresholds |',
		'| --- | --- | --- | --- | --- | --- |'
	];

	for (const result of results) {
		lines.push(
			`| ${result.name} | ${formatPercent(result.metrics.statements)} | ${formatPercent(result.metrics.branches)} | ${formatPercent(result.metrics.functions)} | ${formatPercent(result.metrics.lines)} | ` +
				`S ${formatPercent(result.thresholds.statements)} / B ${formatPercent(result.thresholds.branches)} / F ${formatPercent(result.thresholds.functions)} / L ${formatPercent(result.thresholds.lines)} |`
		);
		lines.push(
			`| ${result.name} notes | ${result.description} |  |  |  | \`coverage/${result.name}\` |`
		);
	}

	return `${lines.join('\n')}\n`;
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	const selectedSuites = resolveSelectedSuites(options.suites);

	mkdirSync(coverageRoot, { recursive: true });

	const results = [];

	for (const [name, suite] of selectedSuites) {
		const reportsDirectory = resolve(coverageRoot, name);
		const summaryPath = resolve(reportsDirectory, 'coverage-summary.json');
		const testFiles = resolveTestFiles(suite.testGlobs, suite.excludedTestGlobs);

		if (testFiles.length === 0) {
			throw new Error(`Coverage suite "${name}" did not resolve any test files`);
		}

		rmSync(reportsDirectory, { recursive: true, force: true });

		const vitestArgs = [
			'exec',
			'vitest',
			'run',
			'--coverage.enabled=true',
			'--coverage.provider=v8',
			'--coverage.reporter=text',
			'--coverage.reporter=json-summary',
			'--coverage.reporter=html',
			`--coverage.reportsDirectory=${relative(repoRoot, reportsDirectory)}`,
			...coverageSourceInclude.map((pattern) => `--coverage.include=${pattern}`),
			...coverageSourceExclude.map((pattern) => `--coverage.exclude=${pattern}`),
			...suite.projects.map((project) => `--project=${project}`),
			...testFiles
		];

		runCommand('pnpm', vitestArgs);

		const metrics = readSuiteMetrics(summaryPath);
		assertThresholds(name, metrics, suite.thresholds);

		results.push({
			name,
			description: suite.description,
			metrics,
			thresholds: suite.thresholds
		});
	}

	const markdown = renderMarkdown(results);
	const defaultSummaryPath = resolve(coverageRoot, 'summary.md');

	writeFileSync(defaultSummaryPath, markdown);

	if (options.summaryFile) {
		writeFileSync(resolve(process.cwd(), options.summaryFile), markdown);
	}

	process.stdout.write(markdown);
}

main();
