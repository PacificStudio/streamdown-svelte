import type { StreamdownToken } from '../marked/index.js';

const namedHtmlEntities: Record<string, string> = {
	amp: '&',
	apos: "'",
	bull: '•',
	copy: '©',
	gt: '>',
	hearts: '♥',
	lt: '<',
	mdash: '—',
	nbsp: '\u00A0',
	quot: '"'
};

export const decodeHtmlEntities = (value: string): string =>
	value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]+);/g, (match, entity) => {
		if (entity.startsWith('#x') || entity.startsWith('#X')) {
			const codePoint = Number.parseInt(entity.slice(2), 16);
			return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
		}

		if (entity.startsWith('#')) {
			const codePoint = Number.parseInt(entity.slice(1), 10);
			return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
		}

		return namedHtmlEntities[entity] ?? match;
	});

export const renderLeafText = (token: StreamdownToken): string => {
	if (!('text' in token) || typeof token.text !== 'string') {
		return '';
	}

	return token.type === 'text' ? decodeHtmlEntities(token.text) : token.text;
};

export const getTokenChildren = (token: StreamdownToken): StreamdownToken[] =>
	'tokens' in token && Array.isArray(token.tokens) ? (token.tokens as StreamdownToken[]) : [];

export const shouldAnimateLeafText = ({
	animationEnabled,
	insidePopover,
	isStatic,
	token
}: {
	animationEnabled: boolean;
	insidePopover: boolean;
	isStatic: boolean;
	token: StreamdownToken;
}): boolean => animationEnabled && !insidePopover && !isStatic && token.type !== 'codespan';
