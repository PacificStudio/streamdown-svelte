import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const inventoryPath = resolve(repoRoot, 'docs/reference-tests-inventory.md');
const outputPath = resolve(repoRoot, 'docs/test-migration-status.md');

const PASS_STATUS_BY_MIGRATION_STATUS = {
	accepted_drift: 'accepted drift',
	blocked_by_missing_surface: 'blocked',
	mapped_to_local_tests: 'passes (local analogue)',
	not_started: 'missing',
	partial_local_coverage: 'partial',
	ported_to_local_harness: 'passes (ported)',
	ported_with_documented_gap: 'passes (ported gap)',
	support_file: 'support only'
};

const PASS_STATUS_ORDER = [
	'passes (ported)',
	'passes (ported gap)',
	'passes (local analogue)',
	'accepted drift',
	'partial',
	'missing',
	'blocked',
	'support only'
];

const PRIORITY_ORDER = ['P0', 'P1', 'P2'];
const SOURCE_SCOPE_ORDER = ['remend', 'streamdown', 'plugins', 'support'];
const PARITY_CATEGORIES = new Set([
	'parser',
	'security',
	'rendering',
	'interactions',
	'plugins',
	'package/export boundaries',
	'performance/framework drift'
]);
const NEXT_ACTIONS = new Set(['implement', 'add/port test', 'accepted drift', 'release blocker']);
const REMAINING_PASS_STATUSES = new Set(['partial', 'missing', 'blocked']);
const ACCEPTED_DRIFT_PASS_STATUS = 'accepted drift';
const METADATA_SECTION_BY_KIND = {
	remaining: '## Categorized Remaining Test Backlog',
	accepted_drift: '## Reviewed Accepted Drift'
};

function parseArgs(argv) {
	const options = {
		check: false,
		write: false,
		summaryFile: null
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (arg === '--check') {
			options.check = true;
			continue;
		}

		if (arg === '--write') {
			options.write = true;
			continue;
		}

		if (arg === '--summary-file') {
			options.summaryFile = argv[index + 1] ?? null;
			index += 1;
			continue;
		}

		throw new Error(`Unknown argument: ${arg}`);
	}

	if (!options.write && !options.check && !options.summaryFile) {
		options.write = true;
	}

	return options;
}

function parseMarkdownRow(line) {
	return line
		.slice(1, -1)
		.split('|')
		.map((cell) => cell.trim());
}

function unwrapCode(cell) {
	return cell.replace(/^`/, '').replace(/`$/, '');
}

function extractLocalDestinations(evidence) {
	const matches = evidence.matchAll(/`((?:src|tests|packages)\/[^`]+)`/g);
	return [...new Set(Array.from(matches, (match) => match[1]))];
}

function formatCell(value) {
	return value.replaceAll('|', '\\|');
}

function formatPaths(paths) {
	if (paths.length === 0) {
		return '-';
	}

	return paths.map((path) => `\`${path}\``).join('<br>');
}

function classifyScope(sourceFile, passStatus) {
	if (passStatus === 'support only') {
		return 'support';
	}

	if (sourceFile.startsWith('packages/remend/')) {
		return 'remend';
	}

	if (sourceFile.startsWith('packages/streamdown/')) {
		return 'streamdown';
	}

	return 'plugins';
}

function formatMarkdown(markdown) {
	try {
		return execFileSync(
			'pnpm',
			['exec', 'prettier', '--parser', 'markdown', '--stdin-filepath', outputPath],
			{
				cwd: repoRoot,
				encoding: 'utf8',
				input: markdown
			}
		);
	} catch (error) {
		throw new Error(
			`Unable to format generated markdown via pnpm exec prettier. Run pnpm install before using --write/--check.\n${error.message}`
		);
	}
}

function parseCategorizedMetadataSection(markdown, kind) {
	const lines = markdown.split('\n');
	const metadata = new Map();
	let inSection = false;

	for (const line of lines) {
		if (line.startsWith('## ')) {
			inSection = line.trim() === METADATA_SECTION_BY_KIND[kind];
			continue;
		}

		if (!inSection || !line.startsWith('|')) {
			continue;
		}

		const cells = parseMarkdownRow(line);

		if (cells.length < 3) {
			continue;
		}

		if (cells[0] === 'Parity category' || /^-+$/.test(cells[0])) {
			continue;
		}

		const parityCategory = unwrapCode(cells[0]);
		const nextAction = unwrapCode(cells[1]);
		const sourceFile = unwrapCode(cells[2]);

		if (!sourceFile.startsWith('packages/')) {
			continue;
		}

		if (!PARITY_CATEGORIES.has(parityCategory)) {
			throw new Error(`Unhandled parity category metadata for ${sourceFile}: ${parityCategory}`);
		}

		if (!NEXT_ACTIONS.has(nextAction)) {
			throw new Error(`Unhandled next action metadata for ${sourceFile}: ${nextAction}`);
		}

		if (metadata.has(sourceFile)) {
			throw new Error(`Duplicate ${kind} metadata entry for ${sourceFile}`);
		}

		metadata.set(sourceFile, {
			kind,
			nextAction,
			parityCategory
		});
	}

	return metadata;
}

function parseCategorizedMetadata(markdown) {
	const metadata = new Map();

	for (const kind of Object.keys(METADATA_SECTION_BY_KIND)) {
		for (const [sourceFile, entry] of parseCategorizedMetadataSection(markdown, kind)) {
			if (metadata.has(sourceFile)) {
				throw new Error(`Duplicate categorized metadata entry for ${sourceFile}`);
			}

			metadata.set(sourceFile, entry);
		}
	}

	return metadata;
}

function parseInventory(markdown, categorizedMetadata) {
	const records = [];

	for (const line of markdown.split('\n')) {
		if (!line.startsWith('|')) {
			continue;
		}

		const cells = parseMarkdownRow(line);
		if (!cells[0]?.startsWith('`packages/')) {
			continue;
		}

		const sourceFile = unwrapCode(cells[0]);
		const isTrackedReferenceFile =
			sourceFile.includes('/__tests__/') &&
			(sourceFile.endsWith('.test.ts') ||
				sourceFile.endsWith('.test.tsx') ||
				sourceFile.endsWith('/setup.ts'));

		if (!isTrackedReferenceFile) {
			continue;
		}

		if (cells.length < 5) {
			throw new Error(`Unexpected inventory row shape: ${line}`);
		}

		const area = unwrapCode(cells[1]);
		const priority = unwrapCode(cells[2]);
		const migrationStatus = unwrapCode(cells[3]);
		const evidence = cells[4];
		const passStatus = PASS_STATUS_BY_MIGRATION_STATUS[migrationStatus];
		const requiresMetadata =
			REMAINING_PASS_STATUSES.has(passStatus) || passStatus === ACCEPTED_DRIFT_PASS_STATUS;
		const metadata = categorizedMetadata.get(sourceFile);

		if (!passStatus) {
			throw new Error(`Unhandled migration status: ${migrationStatus}`);
		}

		if (requiresMetadata && !metadata) {
			throw new Error(`Missing categorized metadata for reference file: ${sourceFile}`);
		}

		records.push({
			area,
			evidence,
			localDestinations: extractLocalDestinations(evidence),
			migrationStatus,
			nextAction: metadata?.nextAction ?? null,
			parityCategory: metadata?.parityCategory ?? null,
			passStatus,
			priority,
			scope: classifyScope(sourceFile, passStatus),
			sourceFile
		});
	}

	return records;
}

function assertMetadataCoverage(records, categorizedMetadata) {
	const recordBySourceFile = new Map(records.map((record) => [record.sourceFile, record]));

	for (const [sourceFile, metadata] of categorizedMetadata) {
		const record = recordBySourceFile.get(sourceFile);
		if (!record) {
			throw new Error(`Categorized metadata exists for ${sourceFile}, but no inventory row exists`);
		}

		if (metadata.kind === 'remaining' && !REMAINING_PASS_STATUSES.has(record.passStatus)) {
			throw new Error(
				`Remaining-test metadata exists for ${sourceFile}, but the file is not unresolved in the inventory tables`
			);
		}

		if (metadata.kind === 'accepted_drift' && record.passStatus !== ACCEPTED_DRIFT_PASS_STATUS) {
			throw new Error(
				`Accepted-drift metadata exists for ${sourceFile}, but the inventory row is not accepted drift`
			);
		}
	}
}

function compareRecords(left, right) {
	return (
		PASS_STATUS_ORDER.indexOf(left.passStatus) - PASS_STATUS_ORDER.indexOf(right.passStatus) ||
		PRIORITY_ORDER.indexOf(left.priority) - PRIORITY_ORDER.indexOf(right.priority) ||
		SOURCE_SCOPE_ORDER.indexOf(left.scope) - SOURCE_SCOPE_ORDER.indexOf(right.scope) ||
		left.sourceFile.localeCompare(right.sourceFile)
	);
}

function countBy(records, selector, allowedKeys) {
	const counts = Object.fromEntries(allowedKeys.map((key) => [key, 0]));

	for (const record of records) {
		const key = selector(record);
		counts[key] += 1;
	}

	return counts;
}

function collectSummary(records) {
	const executable = records.filter((record) => record.passStatus !== 'support only');
	const support = records.filter((record) => record.passStatus === 'support only');
	const passStatusCounts = countBy(records, (record) => record.passStatus, PASS_STATUS_ORDER);
	const p0Remaining = executable.filter(
		(record) => record.priority === 'P0' && REMAINING_PASS_STATUSES.has(record.passStatus)
	);
	const prioritySummary = PRIORITY_ORDER.map((priority) => {
		const priorityRecords = executable.filter((record) => record.priority === priority);

		return {
			priority,
			total: priorityRecords.length,
			ported: priorityRecords.filter((record) => record.passStatus === 'passes (ported)').length,
			portedGap: priorityRecords.filter((record) => record.passStatus === 'passes (ported gap)')
				.length,
			localAnalogue: priorityRecords.filter(
				(record) => record.passStatus === 'passes (local analogue)'
			).length,
			acceptedDrift: priorityRecords.filter(
				(record) => record.passStatus === ACCEPTED_DRIFT_PASS_STATUS
			).length,
			partial: priorityRecords.filter((record) => record.passStatus === 'partial').length,
			missing: priorityRecords.filter((record) => record.passStatus === 'missing').length,
			blocked: priorityRecords.filter((record) => record.passStatus === 'blocked').length
		};
	});
	const scopeSummary = SOURCE_SCOPE_ORDER.map((scope) => {
		const scopeRecords = records.filter((record) => record.scope === scope);

		return {
			scope,
			total: scopeRecords.length,
			ported: scopeRecords.filter((record) => record.passStatus === 'passes (ported)').length,
			portedGap: scopeRecords.filter((record) => record.passStatus === 'passes (ported gap)')
				.length,
			localAnalogue: scopeRecords.filter(
				(record) => record.passStatus === 'passes (local analogue)'
			).length,
			acceptedDrift: scopeRecords.filter(
				(record) => record.passStatus === ACCEPTED_DRIFT_PASS_STATUS
			).length,
			partial: scopeRecords.filter((record) => record.passStatus === 'partial').length,
			missing: scopeRecords.filter((record) => record.passStatus === 'missing').length,
			blocked: scopeRecords.filter((record) => record.passStatus === 'blocked').length,
			supportOnly: scopeRecords.filter((record) => record.passStatus === 'support only').length
		};
	});

	return {
		executable,
		p0Remaining,
		passStatusCounts,
		prioritySummary,
		scopeSummary,
		support
	};
}

function renderSummaryTable(summary) {
	return [
		'| Category | Count |',
		'| --- | ---: |',
		`| Executable frozen reference files | ${summary.executable.length} |`,
		`| Support files | ${summary.support.length} |`,
		`| Passing via ported upstream file | ${summary.passStatusCounts['passes (ported)']} |`,
		`| Passing with documented port gap | ${summary.passStatusCounts['passes (ported gap)']} |`,
		`| Passing via local analogue only | ${summary.passStatusCounts['passes (local analogue)']} |`,
		`| Reviewed accepted drift | ${summary.passStatusCounts[ACCEPTED_DRIFT_PASS_STATUS]} |`,
		`| Partial local coverage | ${summary.passStatusCounts.partial} |`,
		`| Missing local coverage | ${summary.passStatusCounts.missing} |`,
		`| Blocked by missing surface | ${summary.passStatusCounts.blocked} |`,
		`| Remaining P0 files not yet passing via port or local analogue | ${summary.p0Remaining.length} |`
	].join('\n');
}

function renderPriorityTable(summary) {
	const lines = [
		'| Priority | Total executable files | Ported | Ported gap | Local analogue | Accepted drift | Partial | Missing | Blocked |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'
	];

	for (const row of summary.prioritySummary) {
		lines.push(
			`| \`${row.priority}\` | ${row.total} | ${row.ported} | ${row.portedGap} | ${row.localAnalogue} | ${row.acceptedDrift} | ${row.partial} | ${row.missing} | ${row.blocked} |`
		);
	}

	return lines.join('\n');
}

function renderScopeTable(summary) {
	const lines = [
		'| Scope | Total files | Ported | Ported gap | Local analogue | Accepted drift | Partial | Missing | Blocked | Support only |',
		'| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'
	];

	for (const row of summary.scopeSummary) {
		lines.push(
			`| \`${row.scope}\` | ${row.total} | ${row.ported} | ${row.portedGap} | ${row.localAnalogue} | ${row.acceptedDrift} | ${row.partial} | ${row.missing} | ${row.blocked} | ${row.supportOnly} |`
		);
	}

	return lines.join('\n');
}

function renderRemainingTable(records) {
	if (records.length === 0) {
		return '_None._';
	}

	const lines = [
		'| Source file | Parity category | Next action | Priority | Local destination | Pass status | Blocker |',
		'| --- | --- | --- | --- | --- | --- | --- |'
	];

	for (const record of records.sort(compareRecords)) {
		lines.push(
			`| \`${formatCell(record.sourceFile)}\` | \`${formatCell(record.parityCategory ?? '-')}\` | \`${formatCell(record.nextAction ?? '-')}\` | \`${record.priority}\` | ${formatPaths(record.localDestinations)} | \`${record.passStatus}\` | ${formatCell(record.evidence)} |`
		);
	}

	return lines.join('\n');
}

function renderAcceptedDriftTable(records) {
	if (records.length === 0) {
		return '_None._';
	}

	const lines = [
		'| Source file | Parity category | Next action | Priority | Local destination | Evidence |',
		'| --- | --- | --- | --- | --- | --- |'
	];

	for (const record of records.sort(compareRecords)) {
		lines.push(
			`| \`${formatCell(record.sourceFile)}\` | \`${formatCell(record.parityCategory ?? '-')}\` | \`${formatCell(record.nextAction ?? '-')}\` | \`${record.priority}\` | ${formatPaths(record.localDestinations)} | ${formatCell(record.evidence)} |`
		);
	}

	return lines.join('\n');
}

function renderFullTracker(records) {
	const lines = [
		'| Source file | Area | Parity category | Next action | Priority | Migration status | Local destination | Pass status | Blockers or evidence |',
		'| --- | --- | --- | --- | --- | --- | --- | --- | --- |'
	];

	for (const record of [...records].sort(compareRecords)) {
		lines.push(
			`| \`${formatCell(record.sourceFile)}\` | \`${formatCell(record.area)}\` | \`${formatCell(record.parityCategory ?? '-')}\` | \`${formatCell(record.nextAction ?? '-')}\` | \`${record.priority}\` | \`${formatCell(record.migrationStatus)}\` | ${formatPaths(record.localDestinations)} | \`${record.passStatus}\` | ${formatCell(record.evidence)} |`
		);
	}

	return lines.join('\n');
}

function renderDocument(records) {
	const summary = collectSummary(records);

	return (
		`# Test Migration Status

This document tracks ` +
		`P2-06: Track Test Migration Coverage` +
		` from \`PLAN.md\`. It is generated from \`docs/reference-tests-inventory.md\` so the frozen reference inventory stays the single source of truth.

Reference inputs:

- Upstream repository: \`https://github.com/vercel/streamdown.git\`
- Frozen commit: \`5f6475139a87dee8af08fcf7b01475292bc064d2\` (\`5f64751\`)
- Inventory source: [docs/reference-tests-inventory.md](./reference-tests-inventory.md)
- Workflow-aligned evidence: \`artifacts/nightly/ported-tests/summary.md\` and \`artifacts/nightly/summary/summary.md\`
- Regenerate: \`node scripts/test-migration-status.mjs --write\`

## At A Glance

${renderSummaryTable(summary)}

## Priority Breakdown

${renderPriorityTable(summary)}

## Scope Breakdown

${renderScopeTable(summary)}

## Remaining Gaps

The table below keeps the missing work visible by listing every file that is still only partially covered, not started, or blocked, together with the normalized parity category and the next action.

${renderRemainingTable(records.filter((record) => REMAINING_PASS_STATUSES.has(record.passStatus)))}

## Reviewed Accepted Drift

These rows are intentionally no longer counted as missing-surface blockers. They remain catalogued here so later closeout work can distinguish reviewed framework drift from actual migration debt.

${renderAcceptedDriftTable(
	records.filter((record) => record.passStatus === ACCEPTED_DRIFT_PASS_STATUS)
)}

## Full Tracker

${renderFullTracker(records)}
`
	);
}

function renderCiSummary(records) {
	const summary = collectSummary(records);
	const highestPriorityGaps = summary.p0Remaining.sort(compareRecords).slice(0, 12);

	const gapTable = [
		'| Source file | Pass status | Local destination | Blocker |',
		'| --- | --- | --- | --- |'
	];

	for (const record of highestPriorityGaps) {
		gapTable.push(
			`| \`${formatCell(record.sourceFile)}\` | \`${record.passStatus}\` | ${formatPaths(record.localDestinations)} | ${formatCell(record.evidence)} |`
		);
	}

	return `## Test Migration Coverage

Generated from \`docs/reference-tests-inventory.md\` against frozen upstream commit \`5f64751\`.

${renderSummaryTable(summary)}

### Highest-priority remaining gaps

${gapTable.join('\n')}

Full tracker: \`docs/test-migration-status.md\`
`;
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	const inventory = readFileSync(inventoryPath, 'utf8');
	const categorizedMetadata = parseCategorizedMetadata(inventory);
	const records = parseInventory(inventory, categorizedMetadata);
	assertMetadataCoverage(records, categorizedMetadata);
	const document = formatMarkdown(renderDocument(records));

	if (options.check) {
		const currentDocument = readFileSync(outputPath, 'utf8');
		if (currentDocument !== document) {
			throw new Error(
				`docs/test-migration-status.md is out of date. Run: node scripts/test-migration-status.mjs --write`
			);
		}
	}

	if (options.write) {
		writeFileSync(outputPath, document);
	}

	if (options.summaryFile) {
		writeFileSync(options.summaryFile, renderCiSummary(records));
	}
}

main();
