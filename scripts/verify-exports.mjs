import { join } from 'node:path';
import {
	assertBuildOutputExists,
	cleanupDirectory,
	createPackDestination,
	createSmokeEntry,
	findTarball,
	parseExportEntries,
	prepareSmokeFixture,
	readJson,
	runCommand,
	runPackSmoke
} from './lib/package-verification.mjs';
import { getPublishablePackages } from './lib/publishable-packages.mjs';

function verifyPackage(pkg) {
	const packageJson = readJson(join(pkg.dir, 'package.json'));
	const exportEntries = parseExportEntries(packageJson);
	const packDestination = createPackDestination(`${pkg.id}-export-verify-`);
	const fixtureDirectory = join(packDestination, 'pack-smoke');

	try {
		runCommand('pnpm', ['pack', '--pack-destination', packDestination], 'pnpm pack', pkg.dir);
		assertBuildOutputExists(pkg.dir, exportEntries);

		const tarballPath = findTarball(packDestination);
		prepareSmokeFixture({
			fixtureTemplateDirectory: pkg.smokeFixtureDir,
			fixtureDirectory,
			tarballPaths: [tarballPath],
			entryContent: createSmokeEntry([
				{
					packageName: packageJson.name,
					exportEntries
				}
			])
		});
		runPackSmoke(fixtureDirectory, [tarballPath], pkg.dir);

		return {
			package: packageJson.name,
			exportsChecked: exportEntries.map((entry) => entry.specifier),
			runtimeImportsSmoked: exportEntries
				.filter((entry) => entry.runtimePaths.length > 0)
				.map((entry) => entry.specifier),
			fixture: 'tests/pack-smoke'
		};
	} finally {
		cleanupDirectory(packDestination);
	}
}

const results = getPublishablePackages().map((pkg) => verifyPackage(pkg));
console.log(JSON.stringify({ packages: results }, null, 2));
