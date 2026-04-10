import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	verifyReleaseArtifactMetadata,
	writeReleaseArtifactMetadata
} from './lib/release-artifacts.mjs';

async function main() {
	const outputDirectory = mkdtempSync(join(tmpdir(), 'svelte-streamdown-release-metadata-'));

	try {
		await writeReleaseArtifactMetadata({
			outputDirectory
		});

		const verificationResult = await verifyReleaseArtifactMetadata(outputDirectory);

		console.log(
			JSON.stringify(
				{
					...verificationResult
				},
				null,
				2
			)
		);
	} finally {
		rmSync(outputDirectory, {
			force: true,
			recursive: true
		});
	}
}

await main();
