import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const [, , inputPath] = process.argv;

if (!inputPath) {
	console.error('Usage: node scripts/benchmark-summary.mjs <benchmark-json>');
	process.exit(1);
}

const report = JSON.parse(readFileSync(inputPath, 'utf8'));
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('en-US', {
	maximumFractionDigits: 1,
	signDisplay: 'always'
});

const comparisons = [];

for (const file of report.files ?? []) {
	for (const group of file.groups ?? []) {
		const local = group.benchmarks?.find((benchmark) => benchmark.name === 'local');
		const reference = group.benchmarks?.find((benchmark) => benchmark.name === 'reference');
		if (!local || !reference) {
			continue;
		}

		const ratio = local.hz / reference.hz;
		comparisons.push({
			file: basename(file.filepath),
			name: group.fullName,
			localHz: local.hz,
			referenceHz: reference.hz,
			ratio,
			winner: ratio >= 1 ? 'local' : 'reference'
		});
	}
}

if (comparisons.length === 0) {
	console.error(`No local/reference benchmark pairs found in ${inputPath}`);
	process.exit(1);
}

const geometricMeanRatio = Math.exp(
	comparisons.reduce((sum, comparison) => sum + Math.log(comparison.ratio), 0) / comparisons.length
);
const localWins = comparisons.filter((comparison) => comparison.winner === 'local').length;
const referenceWins = comparisons.length - localWins;

console.log(`Benchmark summary for ${inputPath}`);
console.log(
	`Pairs: ${comparisons.length} | local wins: ${localWins} | reference wins: ${referenceWins} | geometric mean ratio (local/reference): ${number.format(geometricMeanRatio)}x`
);

for (const comparison of comparisons.sort((left, right) => left.ratio - right.ratio)) {
	const delta = (comparison.ratio - 1) * 100;
	console.log(
		`- ${comparison.winner === 'local' ? 'local faster' : 'reference faster'} | ${comparison.file} | ${comparison.name} | local ${number.format(comparison.localHz)} hz | reference ${number.format(comparison.referenceHz)} hz | ${percent.format(delta)}`
	);
}
