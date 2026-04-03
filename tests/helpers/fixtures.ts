export type FixtureSource = 'local' | 'reference';

const localFixtureModules = import.meta.glob('../fixtures/**/*', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const referenceFixtureModules = import.meta.glob(
	'../../references/streamdown/packages/**/__tests__/__fixtures__/**/*',
	{
		query: '?raw',
		import: 'default',
		eager: true
	}
) as Record<string, string>;

function buildFixtureIndex(prefix: string, modules: Record<string, string>): Map<string, string> {
	const index = new Map<string, string>();

	for (const [fullPath, text] of Object.entries(modules)) {
		if (!fullPath.startsWith(prefix)) {
			throw new Error(`Fixture path ${fullPath} does not start with ${prefix}.`);
		}

		const relativePath = fullPath.slice(prefix.length);
		if (index.has(relativePath)) {
			throw new Error(`Duplicate fixture path registered: ${relativePath}`);
		}

		index.set(relativePath, text);
	}

	return index;
}

const fixtureIndexes = {
	local: buildFixtureIndex('../fixtures/', localFixtureModules),
	reference: buildFixtureIndex('../../references/streamdown/', referenceFixtureModules)
} satisfies Record<FixtureSource, Map<string, string>>;

export function listFixturePaths(source: FixtureSource = 'local'): string[] {
	return [...fixtureIndexes[source].keys()].sort();
}

export function loadFixtureText(path: string, source: FixtureSource = 'local'): string {
	const text = fixtureIndexes[source].get(path);

	if (typeof text !== 'string') {
		throw new Error(
			`Missing ${source} fixture: ${path}. Available fixtures: ${listFixturePaths(source).join(', ')}`
		);
	}

	return text;
}

export function loadFixturePair(
	inputPath: string,
	expectedPath: string,
	source: FixtureSource = 'local'
): { input: string; expected: string } {
	return {
		input: loadFixtureText(inputPath, source),
		expected: loadFixtureText(expectedPath, source)
	};
}
