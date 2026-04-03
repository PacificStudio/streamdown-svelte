import {
	parseReleaseMetadataCommand,
	writeReleaseArtifactMetadata
} from './lib/release-artifacts.mjs';

async function main() {
	const command = parseReleaseMetadataCommand(process.argv.slice(2));
	const result = await writeReleaseArtifactMetadata({
		outputDirectory: command.outputDirectory
	});

	console.log(JSON.stringify(result, null, 2));
}

await main();
