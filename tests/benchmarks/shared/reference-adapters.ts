// @ts-nocheck
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const referencePackagesRoot = '../../../references/streamdown/packages';

const referenceRemendModule = await import(`${referencePackagesRoot}/remend/src/index.ts`);
const referenceParseBlocksModule = await import(
	`${referencePackagesRoot}/streamdown/lib/parse-blocks.tsx`
);
const referenceTableUtilsModule = await import(
	`${referencePackagesRoot}/streamdown/lib/table/utils.ts`
);
const referenceStreamdownModule = await import(`${referencePackagesRoot}/streamdown/index.tsx`);

const ReferenceStreamdown = referenceStreamdownModule.Streamdown;

const referenceBaseProps = {
	controls: false,
	lineNumbers: false,
	mode: 'static' as const,
	parseIncompleteMarkdown: false
};

export const referenceRemend = referenceRemendModule.default as (input: string) => string;
export const referenceParseBlocks = referenceParseBlocksModule.parseMarkdownIntoBlocks as (
	input: string
) => string[];
export const referenceTableDataToCSV = referenceTableUtilsModule.tableDataToCSV as (table: {
	headers: string[];
	rows: string[][];
}) => string;
export const referenceTableDataToTSV = referenceTableUtilsModule.tableDataToTSV as (table: {
	headers: string[];
	rows: string[][];
}) => string;
export const referenceTableDataToMarkdown =
	referenceTableUtilsModule.tableDataToMarkdown as (table: {
		headers: string[];
		rows: string[][];
	}) => string;
export const renderReferenceStreamdown = (content: string): string =>
	renderToStaticMarkup(
		createElement(ReferenceStreamdown, {
			...referenceBaseProps,
			children: content
		})
	);
