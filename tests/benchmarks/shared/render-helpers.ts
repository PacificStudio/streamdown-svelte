// @ts-nocheck
import { render as renderSvelte } from 'svelte/server';
import LocalStreamdown from '../../../src/lib/Streamdown.svelte';
export { renderReferenceStreamdown } from './reference-adapters';

const localBaseProps = {
	controls: false,
	lineNumbers: false,
	mode: 'static' as const,
	parseIncompleteMarkdown: false
};

export const renderLocalStreamdown = (content: string): string =>
	renderSvelte(LocalStreamdown, {
		props: {
			...localBaseProps,
			content
		}
	}).body;
