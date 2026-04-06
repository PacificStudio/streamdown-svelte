import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export function getPublishablePackages() {
	return [
		{
			id: 'svelte-streamdown',
			dir: repoRoot,
			sourceDir: join(repoRoot, 'src', 'lib'),
			distDir: 'dist',
			smokeFixtureDir: join(repoRoot, 'tests', 'pack-smoke'),
			requiredRootFiles: ['LICENSE', 'README.md', 'package.json'],
			allowedTopLevelDirectories: ['dist']
		},
		{
			id: 'remend',
			dir: join(repoRoot, 'packages', 'remend'),
			sourceDir: join(repoRoot, 'src', 'lib', 'utils'),
			distDir: 'dist',
			smokeFixtureDir: join(repoRoot, 'tests', 'pack-smoke'),
			requiredRootFiles: ['LICENSE', 'README.md', 'package.json'],
			allowedTopLevelDirectories: ['dist']
		}
	];
}
