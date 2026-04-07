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
import { getPublishablePackages, repoRoot } from './lib/publishable-packages.mjs';

function createPackArgs(pkg, packDestination, packageName) {
	return pkg.isRoot
		? ['pack', '--pack-destination', packDestination]
		: ['--filter', packageName, 'pack', '--pack-destination', packDestination];
}

function packWorkspacePackage(pkg, packDestination) {
	const packageJson = readJson(join(pkg.dir, 'package.json'));

	runCommand('pnpm', createPackArgs(pkg, packDestination, packageJson.name), 'pnpm pack', repoRoot);

	return {
		exportEntries: parseExportEntries(packageJson),
		packageJson,
		tarballPath: findTarball(packDestination)
	};
}

function collectWorkspaceDependencyTarballs(packageName, packedPackages) {
	const visited = new Set();
	const tarballPaths = [];

	const visit = (dependencyName) => {
		if (visited.has(dependencyName)) {
			return;
		}

		const dependencyPackage = packedPackages.get(dependencyName);
		if (!dependencyPackage) {
			return;
		}

		visited.add(dependencyName);

		const dependencyFields = [
			dependencyPackage.packageJson.dependencies,
			dependencyPackage.packageJson.optionalDependencies,
			dependencyPackage.packageJson.peerDependencies
		];

		for (const dependencyField of dependencyFields) {
			for (const nestedDependencyName of Object.keys(dependencyField ?? {})) {
				visit(nestedDependencyName);
			}
		}

		tarballPaths.push(dependencyPackage.tarballPath);
	};

	const rootPackage = packedPackages.get(packageName);
	for (const dependencyField of [
		rootPackage?.packageJson.dependencies,
		rootPackage?.packageJson.optionalDependencies,
		rootPackage?.packageJson.peerDependencies
	]) {
		for (const dependencyName of Object.keys(dependencyField ?? {})) {
			visit(dependencyName);
		}
	}

	return tarballPaths;
}

function packPublishablePackages() {
	const packedPackages = new Map();
	const tempDirectories = [];

	try {
		for (const pkg of getPublishablePackages()) {
			const packDestination = createPackDestination(`${pkg.id}-export-verify-`);
			tempDirectories.push(packDestination);
			packedPackages.set(pkg.packageName, {
				pkg,
				...packWorkspacePackage(pkg, packDestination)
			});
		}

		return {
			packedPackages,
			cleanup: () => {
				for (const directory of tempDirectories) {
					cleanupDirectory(directory);
				}
			}
		};
	} catch (error) {
		for (const directory of tempDirectories) {
			cleanupDirectory(directory);
		}
		throw error;
	}
}

function verifyPackage(pkg, packedPackages) {
	const packDestination = createPackDestination(`${pkg.id}-export-verify-smoke-`);
	const fixtureDirectory = join(packDestination, 'pack-smoke');
	const tempDirectories = [packDestination];

	try {
		const packedPackage = packedPackages.get(pkg.packageName);
		if (!packedPackage) {
			throw new Error(`Missing packed package metadata for ${pkg.packageName}`);
		}

		const { exportEntries, packageJson, tarballPath } = packedPackage;
		assertBuildOutputExists(pkg.dir, exportEntries);

		const tarballPaths = [
			...collectWorkspaceDependencyTarballs(packageJson.name, packedPackages),
			tarballPath
		];

		prepareSmokeFixture({
			fixtureTemplateDirectory: pkg.smokeFixtureDir,
			fixtureDirectory,
			tarballPaths,
			entryContent: createSmokeEntry([
				{
					packageName: packageJson.name,
					exportEntries
				}
			])
		});
		runPackSmoke(fixtureDirectory, tarballPaths, repoRoot);

		return {
			package: packageJson.name,
			directory: pkg.relativeDir,
			exportsChecked: exportEntries.map((entry) => entry.specifier),
			runtimeImportsSmoked: exportEntries
				.filter((entry) => entry.runtimePaths.length > 0)
				.map((entry) => entry.specifier),
			fixture: 'tests/pack-smoke'
		};
	} finally {
		for (const directory of tempDirectories) {
			cleanupDirectory(directory);
		}
	}
}

const packed = packPublishablePackages();

try {
	const results = getPublishablePackages().map((pkg) => verifyPackage(pkg, packed.packedPackages));
	console.log(JSON.stringify({ packages: results }, null, 2));
} finally {
	packed.cleanup();
}
