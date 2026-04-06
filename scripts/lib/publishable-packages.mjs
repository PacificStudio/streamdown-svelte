import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { listWorkspacePackages } from './workspace-packages.mjs';

export const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

const shared = {
	smokeFixtureDir: join(repoRoot, 'tests', 'pack-smoke'),
	requiredRootFiles: ['LICENSE', 'README.md', 'package.json'],
	allowedTopLevelDirectories: ['dist']
};

function createPackageId(packageName) {
	return packageName.replace(/^@/, '').replaceAll('/', '-');
}

export function getPublishablePackages() {
	return listWorkspacePackages(repoRoot, { includeRoot: true })
		.filter(({ packageJson }) => packageJson.private !== true)
		.map(({ dir, relativeDir, packageJson }) => ({
			id: createPackageId(packageJson.name),
			dir,
			relativeDir,
			packageName: packageJson.name,
			isRoot: relativeDir === '.',
			...shared
		}));
}
