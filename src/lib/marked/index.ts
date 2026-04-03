import {
	Lexer,
	type MarkedToken,
	type RendererExtensionFunction,
	type Token,
	type TokenizerExtensionFunction,
	type TokenizerStartFunction,
	type TokenizerThis,
	type Tokens,
	type TokensList
} from 'marked';
import { markedAlert, type AlertToken } from './marked-alert.js';
import { markedFootnote, type FootnoteToken } from './marked-footnotes.js';
import { markedMath, type MathToken } from './marked-math.js';
import { markedSub, markedSup, type SubSupToken } from './marked-subsup.js';
import { markedList, type ListItemToken, type ListToken } from './marked-list.js';
import { markedBr, type BrToken } from './marked-br.js';
import { markedHr, type HrToken } from './marked-hr.js';
import {
	markedTable,
	type TableToken,
	type THead,
	type TBody,
	type TFoot,
	type THeadRow,
	type TRow,
	type TH,
	type TD
} from './marked-table.js';
import {
	markedDl,
	type DescriptionDetailToken,
	type DescriptionListToken,
	type DescriptionTermToken,
	type DescriptionToken
} from './marked-dl.js';
import { markedAlign, type AlignToken } from './marked-align.js';
import { markedCitations, type CitationToken } from './marked-citations.js';
import { markedMdx, type MdxToken } from './marked-mdx.js';
import { markedCjk } from './marked-cjk.js';

export type GenericToken = {
	type: string;
	raw: string;
	tokens?: Token[];
} & Record<string, any>;

export type Extension = {
	name: string;
	level: 'block' | 'inline';
	tokenizer: (
		this: TokenizerThis,
		src: string,
		tokens: Token[] | TokensList
	) => GenericToken | undefined;
	start?: TokenizerStartFunction;
	applyInBlockParsing?: boolean;
};

export type StreamdownToken =
	| Exclude<MarkedToken, Tokens.List | Tokens.ListItem | Tokens.Table>
	| ListToken
	| ListItemToken
	| MathToken
	| AlertToken
	| FootnoteToken
	| SubSupToken
	| BrToken
	| HrToken
	| TableToken
	| THead
	| TBody
	| TFoot
	| THeadRow
	| TRow
	| TH
	| TD
	| DescriptionListToken
	| DescriptionToken
	| DescriptionDetailToken
	| DescriptionTermToken
	| AlignToken
	| CitationToken
	| MdxToken;

// Re-export table types from marked-table
export type { TableToken, THead, TBody, TFoot, THeadRow, TRow, TH, TD } from './marked-table.js';

const footnoteReferencePattern = /\[\^[\w-]{1,200}\](?!:)/;
const footnoteDefinitionPattern = /\[\^[\w-]{1,200}\]:/;
const closingTagPattern = /<\/(\w+)>/;
const openingTagPattern = /<(\w+)[\s>]/;

const voidElements = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
]);

const openTagPatternCache = new Map<string, RegExp>();
const closeTagPatternCache = new Map<string, RegExp>();

const getOpenTagPattern = (tagName: string): RegExp => {
	const normalizedTag = tagName.toLowerCase();
	const cached = openTagPatternCache.get(normalizedTag);
	if (cached) {
		return cached;
	}

	const pattern = new RegExp(`<${normalizedTag}(?=[\\s>/])[^>]*>`, 'gi');
	openTagPatternCache.set(normalizedTag, pattern);
	return pattern;
};

const getCloseTagPattern = (tagName: string): RegExp => {
	const normalizedTag = tagName.toLowerCase();
	const cached = closeTagPatternCache.get(normalizedTag);
	if (cached) {
		return cached;
	}

	const pattern = new RegExp(`</${normalizedTag}(?=[\\s>])[^>]*>`, 'gi');
	closeTagPatternCache.set(normalizedTag, pattern);
	return pattern;
};

const countNonSelfClosingOpenTags = (block: string, tagName: string): number => {
	if (voidElements.has(tagName.toLowerCase())) {
		return 0;
	}

	const matches = block.match(getOpenTagPattern(tagName));
	if (!matches) {
		return 0;
	}

	let count = 0;
	for (const match of matches) {
		if (!match.trimEnd().endsWith('/>')) {
			count += 1;
		}
	}

	return count;
};

const countClosingTags = (block: string, tagName: string): number => {
	const matches = block.match(getCloseTagPattern(tagName));
	return matches ? matches.length : 0;
};

const countDoubleDollars = (value: string): number => {
	let count = 0;
	for (let i = 0; i < value.length - 1; i += 1) {
		if (value[i] === '$' && value[i + 1] === '$') {
			count += 1;
			i += 1;
		}
	}

	return count;
};

const parseExtensions = (...extensions: Extension[]) => {
	const options: {
		gfm: boolean;
		extensions: {
			block: TokenizerExtensionFunction[];
			inline: TokenizerExtensionFunction[];
			childTokens: Record<string, string[]>;
			renderers: Record<string, RendererExtensionFunction>;
			startBlock: TokenizerStartFunction[];
			startInline: TokenizerStartFunction[];
		};
	} = {
		gfm: true,
		extensions: {
			block: [],
			inline: [],
			childTokens: {},
			renderers: {},
			startBlock: [],
			startInline: []
		}
	};

	extensions.forEach(({ level, name, tokenizer, ...rest }) => {
		if ('start' in rest && rest.start) {
			if (level === 'block') {
				options.extensions.startBlock!.push(rest.start as TokenizerStartFunction);
			} else {
				options.extensions.startInline!.push(rest.start as TokenizerStartFunction);
			}
		}
		if (tokenizer) {
			if (level === 'block') {
				options.extensions.block.push(tokenizer);
			} else {
				options.extensions.inline.push(tokenizer);
			}
		}
	});

	return options;
};

export const lex = (markdown: string, extensions: Extension[] = []): StreamdownToken[] => {
	return new Lexer(
		parseExtensions(
			markedHr,
			markedTable,
			...markedFootnote(),
			markedAlert,
			...markedMath,
			...markedCjk,
			markedSub,
			markedSup,
			markedList,
			markedBr,
			markedDl,
			markedAlign,
			markedCitations,
			markedMdx,
			...extensions
		)
	)
		.lex(markdown)
		.filter((token) => token.type !== 'space' && token.type !== 'footnote') as StreamdownToken[];
};

export const parseBlocks = (markdown: string, extensions: Extension[] = []): string[] => {
	if (footnoteReferencePattern.test(markdown) || footnoteDefinitionPattern.test(markdown)) {
		return [markdown];
	}

	const blockLexer = new Lexer(
		parseExtensions(
			markedHr,
			...markedFootnote(),
			markedDl,
			markedTable,
			markedAlign,
			markedMdx,
			...extensions.filter(
				({ level, applyInBlockParsing }) => level === 'block' && applyInBlockParsing
			)
		)
	);

	const mergedBlocks: string[] = [];
	const htmlStack: string[] = [];
	let previousTokenWasCode = false;

	for (const token of blockLexer.lex(markdown) as GenericToken[]) {
		if (token.type === 'space' || token.type === 'footnote') {
			continue;
		}

		const currentBlock = token.raw;
		const mergedBlocksLength = mergedBlocks.length;

		if (htmlStack.length > 0) {
			mergedBlocks[mergedBlocksLength - 1] += currentBlock;

			const trackedTag = htmlStack.at(-1) as string;
			const newOpenTags = countNonSelfClosingOpenTags(currentBlock, trackedTag);
			const newCloseTags = countClosingTags(currentBlock, trackedTag);

			for (let i = 0; i < newOpenTags; i += 1) {
				htmlStack.push(trackedTag);
			}

			for (let i = 0; i < newCloseTags; i += 1) {
				if (htmlStack.length > 0 && htmlStack.at(-1) === trackedTag) {
					htmlStack.pop();
				}
			}

			previousTokenWasCode = token.type === 'code';
			continue;
		}

		if (token.type === 'html' && token.block) {
			const openingTagMatch = currentBlock.match(openingTagPattern);
			if (openingTagMatch) {
				const tagName = openingTagMatch[1];
				const openTags = countNonSelfClosingOpenTags(currentBlock, tagName);
				const closeTags = countClosingTags(currentBlock, tagName);
				if (openTags > closeTags) {
					htmlStack.push(tagName);
				}
			}
		}

		if (mergedBlocksLength > 0 && !previousTokenWasCode) {
			const previousBlock = mergedBlocks[mergedBlocksLength - 1];
			if (countDoubleDollars(previousBlock) % 2 === 1) {
				mergedBlocks[mergedBlocksLength - 1] = previousBlock + currentBlock;
				previousTokenWasCode = token.type === 'code';
				continue;
			}
		}

		mergedBlocks.push(currentBlock);
		previousTokenWasCode = token.type === 'code';
	}

	return mergedBlocks;
};

export type {
	MathToken,
	AlertToken,
	FootnoteToken,
	SubSupToken,
	BrToken,
	HrToken,
	AlignToken,
	CitationToken,
	MdxToken
};
