import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(appRoot, '../..');

export default defineConfig({
	cacheDir: resolve(appRoot, '.vite'),
	root: appRoot,
	plugins: [tailwindcss(), react()],
	assetsInclude: ['**/*.md'],
	resolve: {
		alias: {
			'@streamdown/cjk': resolve(
				repoRoot,
				'references/streamdown/packages/streamdown-cjk/index.ts'
			),
			'@streamdown/code': resolve(
				repoRoot,
				'references/streamdown/packages/streamdown-code/index.ts'
			),
			'@streamdown/math': resolve(
				repoRoot,
				'references/streamdown/packages/streamdown-math/index.ts'
			),
			'@streamdown/mermaid': resolve(
				repoRoot,
				'references/streamdown/packages/streamdown-mermaid/index.ts'
			),
			remend: resolve(repoRoot, 'references/streamdown/packages/remend/src/index.ts'),
			streamdown: resolve(repoRoot, 'references/streamdown/packages/streamdown/index.tsx')
		}
	}
});
