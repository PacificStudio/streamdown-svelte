import {
	copyFileSync,
	createReadStream,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	statSync,
	writeFileSync
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { finished } from 'node:stream/promises';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { getPublishablePackages } from './publishable-packages.mjs';

export const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const packageJsonPath = join(repoRoot, 'package.json');

function parseOptionalNonEmptyString(value) {
	if (typeof value !== 'string') {
		return null;
	}

	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

function parseRequiredNonEmptyString(value, label) {
	const parsed = parseOptionalNonEmptyString(value);

	if (!parsed) {
		throw new Error(`${label} must be a non-empty string`);
	}

	return parsed;
}

export function runCommand(command, args, label, cwd = repoRoot) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: 'utf8',
		stdio: 'pipe',
		maxBuffer: 10 * 1024 * 1024
	});

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		const stderr = result.stderr.trim();
		const stdout = result.stdout.trim();
		throw new Error(
			[`${label} failed`, stderr, stdout].filter(Boolean).join('\n') ||
				`Failed to run ${command} ${args.join(' ')}`
		);
	}

	return result.stdout.trim();
}

export function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function readRootPackageJson() {
	return readJson(packageJsonPath);
}

function createPackDestination() {
	return mkdtempSync(join(tmpdir(), 'svelte-streamdown-release-pack-'));
}

function clearReleaseArtifactOutputs(outputDirectory) {
	for (const entry of readdirSync(outputDirectory)) {
		if (
			entry.endsWith('.tgz') ||
			entry.endsWith('.sha256') ||
			entry === 'build-metadata.json' ||
			entry === 'artifact-metadata.json' ||
			entry === 'provenance-metadata.json' ||
			entry === 'release-packages.json' ||
			entry === 'publish-with-provenance.json' ||
			entry === 'post-publish-verify.json'
		) {
			rmSync(join(outputDirectory, entry), {
				force: true
			});
		}
	}
}

function findTarball(packDestination) {
	const tarballs = readdirSync(packDestination).filter((entry) => entry.endsWith('.tgz'));

	if (tarballs.length !== 1) {
		throw new Error(
			`Expected exactly one tarball from pnpm pack, found ${tarballs.length}: ${tarballs.join(', ')}`
		);
	}

	return join(packDestination, tarballs[0]);
}

function toRepoRelativePath(path) {
	const relativePath = relative(repoRoot, path);
	return relativePath.split(sep).join('/');
}

function toPortableCommandPath(path) {
	const relativePath = relative(repoRoot, path);

	if (!relativePath || relativePath.startsWith('..')) {
		return `./${basename(path)}`;
	}

	return `./${relativePath.split(sep).join('/')}`;
}

async function computeHashes(filePath) {
	const sha256Hash = createHash('sha256');
	const sha512HexHash = createHash('sha512');
	const sha512IntegrityHash = createHash('sha512');
	const stream = createReadStream(filePath);

	stream.on('data', (chunk) => {
		sha256Hash.update(chunk);
		sha512HexHash.update(chunk);
		sha512IntegrityHash.update(chunk);
	});

	await finished(stream);

	return {
		sha256: sha256Hash.digest('hex'),
		sha512: sha512HexHash.digest('hex'),
		integrity: `sha512-${sha512IntegrityHash.digest('base64')}`
	};
}

function normalizeRepositoryIdentifier(rawRepository) {
	const value = parseOptionalNonEmptyString(rawRepository);

	if (!value) {
		return null;
	}

	const normalizedValue = value.replace(/^git\+/u, '').replace(/\.git$/u, '');
	const directMatch = normalizedValue.match(
		/^(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)$/u
	);

	if (directMatch?.groups) {
		return `${directMatch.groups.owner}/${directMatch.groups.repo}`;
	}

	const httpsMatch = normalizedValue.match(
		/^https:\/\/github\.com\/(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)$/u
	);

	if (httpsMatch?.groups) {
		return `${httpsMatch.groups.owner}/${httpsMatch.groups.repo}`;
	}

	const sshMatch = normalizedValue.match(
		/^git@github\.com:(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)$/u
	);

	if (sshMatch?.groups) {
		return `${sshMatch.groups.owner}/${sshMatch.groups.repo}`;
	}

	return normalizedValue;
}

function readRepositoryIdentifier(packageJson, env) {
	const githubRepository = parseOptionalNonEmptyString(env.GITHUB_REPOSITORY);

	if (githubRepository) {
		return normalizeRepositoryIdentifier(githubRepository) ?? 'unknown';
	}

	const repositoryField = packageJson.repository;

	if (typeof repositoryField === 'string') {
		return normalizeRepositoryIdentifier(repositoryField) ?? 'unknown';
	}

	if (repositoryField && typeof repositoryField === 'object' && !Array.isArray(repositoryField)) {
		return normalizeRepositoryIdentifier(repositoryField.url) ?? 'unknown';
	}

	return 'unknown';
}

function readGitCommitSha(env) {
	return (
		parseOptionalNonEmptyString(env.GITHUB_SHA) ??
		runCommand('git', ['rev-parse', 'HEAD'], 'git rev-parse')
	);
}

function readPnpmVersion() {
	return runCommand('pnpm', ['--version'], 'pnpm --version');
}

function createBuildMetadata(packageJson, env) {
	const repository = readRepositoryIdentifier(packageJson, env);
	const commitSha = readGitCommitSha(env);
	const serverUrl = parseOptionalNonEmptyString(env.GITHUB_SERVER_URL) ?? 'https://github.com';
	const runId = parseOptionalNonEmptyString(env.GITHUB_RUN_ID);
	const runUrl =
		repository !== 'unknown' && runId ? `${serverUrl}/${repository}/actions/runs/${runId}` : null;

	return {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		package: {
			name: packageJson.name,
			version: packageJson.version
		},
		source: {
			repository,
			commitSha,
			ref: parseOptionalNonEmptyString(env.GITHUB_REF),
			refName: parseOptionalNonEmptyString(env.GITHUB_REF_NAME),
			eventName: parseOptionalNonEmptyString(env.GITHUB_EVENT_NAME),
			workflow: parseOptionalNonEmptyString(env.GITHUB_WORKFLOW),
			workflowRef: parseOptionalNonEmptyString(env.GITHUB_WORKFLOW_REF),
			job: parseOptionalNonEmptyString(env.GITHUB_JOB),
			runId,
			runAttempt: parseOptionalNonEmptyString(env.GITHUB_RUN_ATTEMPT),
			runUrl,
			actor: parseOptionalNonEmptyString(env.GITHUB_ACTOR)
		},
		build: {
			ciProvider:
				env.GITHUB_ACTIONS === 'true' ? 'github-actions' : env.CI ? 'generic-ci' : 'local',
			nodeVersion: process.version,
			pnpmVersion: readPnpmVersion(),
			platform: process.platform,
			arch: process.arch
		}
	};
}

async function createArtifactMetadata(packageJson, tarballPath) {
	const stats = statSync(tarballPath);
	const hashes = await computeHashes(tarballPath);

	return {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		package: {
			name: packageJson.name,
			version: packageJson.version
		},
		tarball: {
			fileName: basename(tarballPath),
			sizeBytes: stats.size,
			sha256: hashes.sha256,
			sha512: hashes.sha512,
			integrity: hashes.integrity
		}
	};
}

function createProvenanceMetadata(buildMetadata, artifactMetadata, env, outputDirectory) {
	const inGitHubActions = buildMetadata.build.ciProvider === 'github-actions';
	const repository = buildMetadata.source.repository;
	const tarballFileName = artifactMetadata.tarball.fileName;
	const tarballCommandPath = toPortableCommandPath(join(outputDirectory, tarballFileName));

	return {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		subject: {
			name: tarballFileName,
			sha256: artifactMetadata.tarball.sha256
		},
		githubAttestation: {
			supported: inGitHubActions,
			repository: repository === 'unknown' ? null : repository,
			signerWorkflow: inGitHubActions ? '.github/workflows/release.yml' : null,
			verifyCommand:
				inGitHubActions && repository !== 'unknown'
					? `gh attestation verify ${tarballCommandPath} --repo ${repository}`
					: null,
			attestationUrl: null,
			bundlePath: null
		},
		npmProvenance: {
			expectedWhenTrustedPublishing: inGitHubActions,
			publishCommand: `npm publish ${tarballCommandPath}`,
			requirements: {
				publicRepository: true,
				publicPackage: true,
				githubHostedRunner: true,
				trustedPublisherWorkflow: 'release.yml'
			},
			publishRequested: false,
			publishAllowed: inGitHubActions,
			publishSkippedReason: null,
			published: false,
			publishMethod: null,
			packageUrl: null,
			tagName: null
		}
	};
}

function writeSha256File(outputDirectory, artifactMetadata) {
	const fileName = `${artifactMetadata.tarball.fileName}.sha256`;
	const content = `${artifactMetadata.tarball.sha256}  ${artifactMetadata.tarball.fileName}\n`;
	const outputPath = join(outputDirectory, fileName);
	writeFileSync(outputPath, content);
	return outputPath;
}

function readWorkspacePackageJson(pkg) {
	return readJson(join(pkg.dir, 'package.json'));
}

function createPackArgs(pkg) {
	return pkg.isRoot
		? ['pack', '--pack-destination', pkg.packDestination]
		: ['--filter', pkg.packageName, 'pack', '--pack-destination', pkg.packDestination];
}

function getWorkspaceDependencyNames(packageJson, workspacePackageNames) {
	const dependencyNames = new Set();

	for (const dependencyField of [packageJson.dependencies, packageJson.optionalDependencies]) {
		for (const dependencyName of Object.keys(dependencyField ?? {})) {
			if (workspacePackageNames.has(dependencyName)) {
				dependencyNames.add(dependencyName);
			}
		}
	}

	return [...dependencyNames].sort((left, right) => left.localeCompare(right));
}

function sortPackagesForPublish(packages) {
	const packagesByName = new Map(packages.map((pkg) => [pkg.packageName, pkg]));
	const packageNames = new Set(packagesByName.keys());
	const visited = new Set();
	const visiting = new Set();
	const ordered = [];

	const visit = (pkg) => {
		if (visited.has(pkg.packageName)) {
			return;
		}

		if (visiting.has(pkg.packageName)) {
			throw new Error(`Detected a circular publish dependency involving ${pkg.packageName}`);
		}

		visiting.add(pkg.packageName);

		for (const dependencyName of getWorkspaceDependencyNames(pkg.packageJson, packageNames)) {
			visit(packagesByName.get(dependencyName));
		}

		visiting.delete(pkg.packageName);
		visited.add(pkg.packageName);
		ordered.push(pkg);
	};

	for (const pkg of [...packages].sort((left, right) => left.relativeDir.localeCompare(right.relativeDir))) {
		visit(pkg);
	}

	return ordered;
}

async function packReleasePackages(outputDirectory) {
	const releasePackages = sortPackagesForPublish(
		getPublishablePackages().map((pkg) => ({
			...pkg,
			packageJson: readWorkspacePackageJson(pkg),
			packDestination: createPackDestination()
		}))
	);

	try {
		const packedArtifacts = [];

		for (const pkg of releasePackages) {
			runCommand('pnpm', createPackArgs(pkg), 'pnpm pack');

			const packedTarball = findTarball(pkg.packDestination);
			const copiedTarballPath = join(outputDirectory, basename(packedTarball));
			copyFileSync(packedTarball, copiedTarballPath);

			const artifactMetadata = await createArtifactMetadata(pkg.packageJson, copiedTarballPath);
			const sha256Path = writeSha256File(outputDirectory, artifactMetadata);

			packedArtifacts.push({
				pkg,
				copiedTarballPath,
				artifactMetadata,
				sha256Path
			});
		}

		return packedArtifacts;
	} finally {
		for (const pkg of releasePackages) {
			rmSync(pkg.packDestination, {
				force: true,
				recursive: true
			});
		}
	}
}

function createReleasePackagesManifest(packedArtifacts) {
	return {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		packages: packedArtifacts.map(({ pkg, artifactMetadata, sha256Path }) => ({
			package: {
				name: pkg.packageJson.name,
				version: pkg.packageJson.version
			},
			relativeDir: pkg.relativeDir,
			publishOrder: pkg.packageName,
			tarball: artifactMetadata.tarball,
			sha256File: basename(sha256Path),
			primary: pkg.isRoot
		}))
	};
}

function getPrimaryReleasePackage(manifest) {
	const primaryPackages = manifest.packages.filter((entry) => entry.primary === true);

	if (primaryPackages.length !== 1) {
		throw new Error(
			`Expected exactly one primary release package, found ${primaryPackages.length}`
		);
	}

	return primaryPackages[0];
}

function verifyReleasePackageArtifacts(outputDirectory, releasePackage) {
	const tarballPath = join(outputDirectory, releasePackage.tarball.fileName);
	const sha256Path = join(outputDirectory, releasePackage.sha256File);

	if (!existsSync(tarballPath)) {
		throw new Error(`Missing release tarball: ${tarballPath}`);
	}

	if (!existsSync(sha256Path)) {
		throw new Error(`Missing release sha256 file: ${sha256Path}`);
	}

	return { tarballPath, sha256Path };
}

export function parseReleaseMetadataCommand(argv, cwd = process.cwd()) {
	const normalizedArgv = argv[0] === '--' ? argv.slice(1) : argv;

	const { values, positionals } = parseArgs({
		args: normalizedArgv,
		options: {
			'output-dir': {
				type: 'string'
			}
		},
		allowPositionals: true
	});

	if (positionals.length > 0) {
		throw new Error(`Unexpected positional arguments: ${positionals.join(', ')}`);
	}

	const rawOutputDirectory =
		parseOptionalNonEmptyString(values['output-dir']) ?? 'artifacts/release';

	return {
		outputDirectory: resolve(cwd, rawOutputDirectory)
	};
}

export async function writeReleaseArtifactMetadata({ outputDirectory, env = process.env }) {
	const rootPackageJson = readRootPackageJson();
	const resolvedOutputDirectory = parseRequiredNonEmptyString(outputDirectory, 'outputDirectory');

	mkdirSync(resolvedOutputDirectory, {
		recursive: true
	});
	clearReleaseArtifactOutputs(resolvedOutputDirectory);

	const packedArtifacts = await packReleasePackages(resolvedOutputDirectory);
	const releasePackagesManifest = createReleasePackagesManifest(packedArtifacts);
	const primaryReleasePackage = getPrimaryReleasePackage(releasePackagesManifest);
	const primaryArtifact = packedArtifacts.find(
		({ pkg }) => pkg.packageJson.name === primaryReleasePackage.package.name
	);

	if (!primaryArtifact) {
		throw new Error(`Missing packed artifact for primary package ${primaryReleasePackage.package.name}`);
	}

	const buildMetadata = createBuildMetadata(rootPackageJson, env);
	const artifactMetadata = primaryArtifact.artifactMetadata;
	const provenanceMetadata = createProvenanceMetadata(
		buildMetadata,
		artifactMetadata,
		env,
		resolvedOutputDirectory
	);

	const buildMetadataPath = join(resolvedOutputDirectory, 'build-metadata.json');
	const artifactMetadataPath = join(resolvedOutputDirectory, 'artifact-metadata.json');
	const provenanceMetadataPath = join(resolvedOutputDirectory, 'provenance-metadata.json');
	const releasePackagesPath = join(resolvedOutputDirectory, 'release-packages.json');

	writeJson(buildMetadataPath, buildMetadata);
	writeJson(artifactMetadataPath, artifactMetadata);
	writeJson(provenanceMetadataPath, provenanceMetadata);
	writeJson(releasePackagesPath, releasePackagesManifest);

	return {
		outputDirectory: resolvedOutputDirectory,
		files: {
			tarballs: packedArtifacts.map(({ copiedTarballPath }) => copiedTarballPath),
			buildMetadata: buildMetadataPath,
			artifactMetadata: artifactMetadataPath,
			provenanceMetadata: provenanceMetadataPath,
			releasePackages: releasePackagesPath,
			sha256: packedArtifacts.map(({ sha256Path }) => sha256Path)
		},
		summary: {
			packageName: buildMetadata.package.name,
			packageVersion: buildMetadata.package.version,
			commitSha: buildMetadata.source.commitSha,
			tarball: toPortableCommandPath(primaryArtifact.copiedTarballPath),
			sha256: artifactMetadata.tarball.sha256,
			runUrl: buildMetadata.source.runUrl,
			packages: releasePackagesManifest.packages.map((entry) => ({
				name: entry.package.name,
				version: entry.package.version,
				tarball: toPortableCommandPath(join(resolvedOutputDirectory, entry.tarball.fileName))
			}))
		}
	};
}

export async function verifyReleaseArtifactMetadata(outputDirectory, env = process.env) {
	const resolvedOutputDirectory = parseRequiredNonEmptyString(outputDirectory, 'outputDirectory');
	const rootPackageJson = readRootPackageJson();
	const buildMetadataPath = join(resolvedOutputDirectory, 'build-metadata.json');
	const artifactMetadataPath = join(resolvedOutputDirectory, 'artifact-metadata.json');
	const provenanceMetadataPath = join(resolvedOutputDirectory, 'provenance-metadata.json');
	const releasePackagesPath = join(resolvedOutputDirectory, 'release-packages.json');

	for (const path of [
		buildMetadataPath,
		artifactMetadataPath,
		provenanceMetadataPath,
		releasePackagesPath
	]) {
		if (!existsSync(path)) {
			throw new Error(`Missing required release metadata file: ${path}`);
		}
	}

	const buildMetadata = readJson(buildMetadataPath);
	const artifactMetadata = readJson(artifactMetadataPath);
	const provenanceMetadata = readJson(provenanceMetadataPath);
	const releasePackagesManifest = readJson(releasePackagesPath);
	const expectedCommitSha = readGitCommitSha(env);

	if (!Array.isArray(releasePackagesManifest.packages) || releasePackagesManifest.packages.length === 0) {
		throw new Error('release-packages.json must include a non-empty packages array');
	}

	const primaryReleasePackage = getPrimaryReleasePackage(releasePackagesManifest);
	const verifiedPackages = [];
	const requiredFiles = [
		'build-metadata.json',
		'artifact-metadata.json',
		'provenance-metadata.json',
		'release-packages.json'
	];

	for (const releasePackage of releasePackagesManifest.packages) {
		const { tarballPath, sha256Path } = verifyReleasePackageArtifacts(
			resolvedOutputDirectory,
			releasePackage
		);
		const computedHashes = await computeHashes(tarballPath);
		const sha256File = readFileSync(sha256Path, 'utf8').trim();

		if (releasePackage.tarball.sizeBytes !== statSync(tarballPath).size) {
			throw new Error(
				`release-packages.json tarball.sizeBytes mismatch for ${releasePackage.package.name}: ${releasePackage.tarball.sizeBytes}`
			);
		}

		if (releasePackage.tarball.sha256 !== computedHashes.sha256) {
			throw new Error(
				`release-packages.json tarball.sha256 mismatch for ${releasePackage.package.name}`
			);
		}

		if (releasePackage.tarball.sha512 !== computedHashes.sha512) {
			throw new Error(
				`release-packages.json tarball.sha512 mismatch for ${releasePackage.package.name}`
			);
		}

		if (releasePackage.tarball.integrity !== computedHashes.integrity) {
			throw new Error(
				`release-packages.json tarball.integrity mismatch for ${releasePackage.package.name}`
			);
		}

		if (sha256File !== `${computedHashes.sha256}  ${releasePackage.tarball.fileName}`) {
			throw new Error(`${basename(sha256Path)} does not match the generated tarball sha256 digest`);
		}

		requiredFiles.push(releasePackage.sha256File);
		verifiedPackages.push({
			name: releasePackage.package.name,
			version: releasePackage.package.version,
			tarball: releasePackage.tarball.fileName,
			sha256: computedHashes.sha256,
			primary: releasePackage.primary === true
		});
	}

	if (buildMetadata.package?.name !== rootPackageJson.name) {
		throw new Error(`build-metadata.json package.name mismatch: ${buildMetadata.package?.name}`);
	}

	if (buildMetadata.package?.version !== rootPackageJson.version) {
		throw new Error(
			`build-metadata.json package.version mismatch: ${buildMetadata.package?.version}`
		);
	}

	if (buildMetadata.source?.commitSha !== expectedCommitSha) {
		throw new Error(
			`build-metadata.json source.commitSha mismatch: expected ${expectedCommitSha}, received ${buildMetadata.source?.commitSha}`
		);
	}

	if (artifactMetadata.package?.name !== primaryReleasePackage.package.name) {
		throw new Error(
			`artifact-metadata.json package.name mismatch: ${artifactMetadata.package?.name}`
		);
	}

	if (artifactMetadata.package?.version !== primaryReleasePackage.package.version) {
		throw new Error(
			`artifact-metadata.json package.version mismatch: ${artifactMetadata.package?.version}`
		);
	}

	if (artifactMetadata.tarball?.fileName !== primaryReleasePackage.tarball.fileName) {
		throw new Error(
			`artifact-metadata.json tarball.fileName mismatch: ${artifactMetadata.tarball?.fileName}`
		);
	}

	const primaryTarballPath = join(resolvedOutputDirectory, primaryReleasePackage.tarball.fileName);
	const primaryHashes = await computeHashes(primaryTarballPath);

	if (artifactMetadata.tarball?.sizeBytes !== statSync(primaryTarballPath).size) {
		throw new Error(
			`artifact-metadata.json tarball.sizeBytes mismatch: ${artifactMetadata.tarball?.sizeBytes}`
		);
	}

	if (artifactMetadata.tarball?.sha256 !== primaryHashes.sha256) {
		throw new Error('artifact-metadata.json tarball.sha256 does not match the generated tarball');
	}

	if (artifactMetadata.tarball?.sha512 !== primaryHashes.sha512) {
		throw new Error('artifact-metadata.json tarball.sha512 does not match the generated tarball');
	}

	if (artifactMetadata.tarball?.integrity !== primaryHashes.integrity) {
		throw new Error(
			'artifact-metadata.json tarball.integrity does not match the generated tarball'
		);
	}

	if (provenanceMetadata.subject?.name !== primaryReleasePackage.tarball.fileName) {
		throw new Error(
			`provenance-metadata.json subject.name mismatch: ${provenanceMetadata.subject?.name}`
		);
	}

	if (provenanceMetadata.subject?.sha256 !== primaryHashes.sha256) {
		throw new Error('provenance-metadata.json subject.sha256 does not match the generated tarball');
	}

	return {
		outputDirectory: resolvedOutputDirectory,
		packageName: rootPackageJson.name,
		packageVersion: rootPackageJson.version,
		commitSha: expectedCommitSha,
		tarball: primaryReleasePackage.tarball.fileName,
		sha256: primaryHashes.sha256,
		packages: verifiedPackages,
		requiredFiles
	};
}
