import type { UserConfig } from 'vite';
import baseConfig from './vite.config';

const config = baseConfig as UserConfig;

export default {
	...config,
	optimizeDeps: undefined
} satisfies UserConfig;
